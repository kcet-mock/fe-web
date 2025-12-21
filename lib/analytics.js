import mixpanel from 'mixpanel-browser';

class Analytics {
  constructor() {
    this.isInitialized = false;
  }

  init() {
    if (!this.isInitialized) {
      mixpanel.init("97ab02184ff13d717ddeac3d96abbae1", {
        debug: process.env.NODE_ENV === 'development',
        track_pageview: true,
        persistence: 'localStorage'
      });
      this.isInitialized = true;
      console.log('Mixpanel initialized');
    }
  }

  // Question Events
  trackQuestionViewed(questionData, subject) {
    if (!this.isInitialized) return;

    const hasImages = questionData.question.some(item => 
      typeof item === 'string' && item.includes('images/')
    );
    const hasMath = questionData.question.some(item => 
      typeof item === 'string' && item.includes('<katex>')
    );

    mixpanel.track('question_viewed', {
      questionId: questionData.id,
      subject: subject,
      hasImages,
      hasMath,
      timestamp: new Date().toISOString()
    });
  }

  trackQuestionAnswered(questionData, subject, selectedIndex, timeSpent, isCorrect) {
    if (!this.isInitialized) return;

    mixpanel.track('question_answered', {
      questionId: questionData.id,
      subject: subject,
      isCorrect,
      selectedAnswer: selectedIndex,
      correctAnswer: questionData.correctAnswer,
      timeSpent, // in seconds
      timestamp: new Date().toISOString()
    });

    // Track separate performance events
    if (isCorrect) {
      mixpanel.track('correct_answer', {
        questionId: questionData.id,
        subject: subject,
        timeSpent,
        timestamp: new Date().toISOString()
      });
    } else {
      mixpanel.track('incorrect_answer', {
        questionId: questionData.id,
        subject: subject,
        selectedAnswer: selectedIndex,
        correctAnswer: questionData.correctAnswer,
        timeSpent,
        timestamp: new Date().toISOString()
      });
    }

    // Track time spent as separate event
    mixpanel.track('time_spent_on_question', {
      questionId: questionData.id,
      subject: subject,
      timeSpent,
      isCorrect,
      timestamp: new Date().toISOString()
    });

    // Update user profile with accuracy
    this.updateUserAccuracy(subject, isCorrect);
  }

  trackAnswerChanged(questionData, subject, oldAnswer, newAnswer) {
    if (!this.isInitialized) return;

    mixpanel.track('answer_changed', {
      questionId: questionData.id,
      subject: subject,
      oldAnswer,
      newAnswer,
      timestamp: new Date().toISOString()
    });
  }

  trackExplanationViewed(questionData, subject, wasCorrect, timeOnExplanation) {
    if (!this.isInitialized) return;

    mixpanel.track('explanation_viewed', {
      questionId: questionData.id,
      subject: subject,
      wasCorrect,
      timeOnExplanation, // in seconds
      timestamp: new Date().toISOString()
    });
  }

  trackQuestionSkipped(questionData, subject) {
    if (!this.isInitialized) return;

    mixpanel.track('question_skipped', {
      questionId: questionData.id,
      subject: subject,
      timestamp: new Date().toISOString()
    });
  }

  trackQuestionFlagged(questionData, subject, reason = '') {
    if (!this.isInitialized) return;

    mixpanel.track('question_flagged', {
      questionId: questionData.id,
      subject: subject,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  // Session Events
  trackSessionStarted(subject, testType = 'mock-test') {
    if (!this.isInitialized) return;

    const deviceType = this.getDeviceType();
    
    mixpanel.track('session_started', {
      subject,
      testType,
      deviceType,
      timestamp: new Date().toISOString()
    });

    // Set user properties
    mixpanel.people.set({
      'Last Active': new Date().toISOString(),
      '$last_seen': new Date().toISOString()
    });
    
    mixpanel.people.increment('Total Sessions', 1);
  }

  trackSubjectSelected(subject, from = 'home') {
    if (!this.isInitialized) return;

    mixpanel.track('subject_selected', {
      subject,
      from,
      timestamp: new Date().toISOString()
    });

    mixpanel.people.set({
      'Last Subject': subject
    });
  }

  trackSessionEnded(subject, questionsAttempted, correctAnswers, timeSpent) {
    if (!this.isInitialized) return;

    const accuracy = questionsAttempted > 0 
      ? (correctAnswers / questionsAttempted) * 100 
      : 0;

    mixpanel.track('session_ended', {
      subject,
      questionsAttempted,
      correctAnswers,
      accuracy: accuracy.toFixed(2),
      timeSpent, // in seconds
      timestamp: new Date().toISOString()
    });
  }

  // Test Completion Events
  trackTestCompleted(subject, totalQuestions, correctAnswers, totalTime, year = 'random') {
    if (!this.isInitialized) return;

    const accuracy = (correctAnswers / totalQuestions) * 100;

    mixpanel.track('test_completed', {
      subject,
      year,
      totalQuestions,
      correctAnswers,
      accuracy: accuracy.toFixed(2),
      totalTime, // in seconds
      timestamp: new Date().toISOString()
    });

    mixpanel.people.set({
      [`${subject}_last_accuracy`]: accuracy.toFixed(2),
      'Last Test Date': new Date().toISOString()
    });

    // Check for accuracy milestones
    if (accuracy >= 90) {
      this.trackAccuracyMilestone('90%', subject);
    } else if (accuracy >= 75) {
      this.trackAccuracyMilestone('75%', subject);
    } else if (accuracy >= 50) {
      this.trackAccuracyMilestone('50%', subject);
    }
  }

  trackAccuracyMilestone(milestone, subject) {
    if (!this.isInitialized) return;

    mixpanel.track('accuracy_milestone', {
      milestone, // e.g., '50%', '75%', '90%'
      subject,
      timestamp: new Date().toISOString()
    });
  }

  // Navigation Events
  trackNavigation(from, to) {
    if (!this.isInitialized) return;

    mixpanel.track('app_navigation', {
      from,
      to,
      timestamp: new Date().toISOString()
    });
  }

  trackPDFDownload(subject, year) {
    if (!this.isInitialized) return;

    mixpanel.track('pdf_downloaded', {
      subject,
      year,
      timestamp: new Date().toISOString()
    });

    mixpanel.people.increment('Total PDF Downloads', 1);
  }

  // Helper Methods
  getDeviceType() {
    if (typeof window === 'undefined') return 'unknown';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  updateUserAccuracy(subject, isCorrect) {
    if (!this.isInitialized) return;
    
    mixpanel.people.increment(`${subject}_total_questions`, 1);
    if (isCorrect) {
      mixpanel.people.increment(`${subject}_correct_answers`, 1);
    }
  }

  // Identify user (optional - for logged in users)
  identifyUser(userId) {
    if (!this.isInitialized) return;
    
    mixpanel.identify(userId);
  }

  // Reset (for logout or new user)
  reset() {
    if (!this.isInitialized) return;
    
    mixpanel.reset();
  }
}

// Export singleton instance
export const analytics = new Analytics();
