# Analytics Implementation Guide

## Overview

This KCET Question Generation website now includes comprehensive Mixpanel analytics tracking to monitor user engagement, learning patterns, and performance metrics.

## Setup Instructions

### 1. Get Your Mixpanel Project Token

1. Sign up for a free account at [mixpanel.com](https://mixpanel.com)
2. Create a new project for KCET
3. Copy your project token from Project Settings

### 2. Configure Environment Variable

Add your Mixpanel token to the `.env` file:

```bash
NEXT_PUBLIC_MIXPANEL_TOKEN=your_actual_mixpanel_token_here
```

**Important:** The token must start with `NEXT_PUBLIC_` to be accessible in the browser.

### 3. Install Dependencies

Dependencies are already installed. If needed:

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

## Tracked Events

### Core Events

#### 1. **Session Started**
- Triggered when a user starts a mock test
- Properties:
  - `subject` (bio/chem/mat/phy)
  - `testType` (random or year-specific)
  - `deviceType` (mobile/tablet/desktop)

#### 2. **Subject Selected**
- Triggered when a user selects a subject
- Properties:
  - `subject`
  - `from` (location: home, previous-papers)

#### 3. **Question Viewed**
- Triggered when a question loads
- Properties:
  - `questionId`
  - `subject`
  - `hasImages` (boolean)
  - `hasMath` (boolean - KaTeX content)

#### 4. **Question Answered**
- Triggered when a user selects an answer
- Properties:
  - `questionId`
  - `subject`
  - `isCorrect` (boolean)
  - `selectedAnswer` (index)
  - `correctAnswer` (index)
  - `timeSpent` (seconds)

#### 5. **Answer Changed**
- Triggered when a user changes their answer
- Properties:
  - `questionId`
  - `subject`
  - `oldAnswer` (index)
  - `newAnswer` (index)

#### 6. **Test Completed**
- Triggered when a user completes a test
- Properties:
  - `subject`
  - `year` (random or specific year)
  - `totalQuestions`
  - `correctAnswers`
  - `accuracy` (percentage)
  - `totalTime` (seconds)

#### 7. **Explanation Viewed**
- Triggered when an explanation comes into view on results page
- Properties:
  - `questionId`
  - `subject`
  - `wasCorrect` (boolean)

#### 8. **Accuracy Milestone**
- Triggered when user achieves 50%, 75%, or 90% accuracy
- Properties:
  - `milestone` (50%, 75%, 90%)
  - `subject`

#### 9. **App Navigation**
- Triggered on page navigation
- Properties:
  - `from` (source page)
  - `to` (destination page)

### User Properties

The following user properties are automatically tracked:

- `Last Active` - Timestamp of last activity
- `Last Subject` - Most recently selected subject
- `Total Sessions` - Cumulative session count
- `{subject}_total_questions` - Questions attempted per subject
- `{subject}_correct_answers` - Correct answers per subject
- `{subject}_last_accuracy` - Most recent accuracy per subject
- `Last Test Date` - Most recent test completion

## Analytics Dashboard Setup

### Recommended Reports

#### 1. **Engagement Overview**
- Daily/Weekly active users
- Average session duration
- Questions per session
- Subject popularity distribution

#### 2. **Performance Metrics**
- Overall accuracy rate by subject
- Accuracy trends over time
- Question difficulty (success rate per question)
- Time spent per question

#### 3. **Learning Patterns**
- Peak usage times
- Session frequency
- Improvement rate over time
- Retry patterns

#### 4. **Content Quality**
- Questions with low success rates
- Questions frequently skipped
- Explanation view rates
- Popular vs. underutilized content

### Sample Queries

**Average accuracy by subject:**
```javascript
Event: "Test Completed"
Group by: subject
Metric: Average of accuracy
```

**Daily active users:**
```javascript
Event: "Session Started"
Unique users per day
```

**Question difficulty:**
```javascript
Event: "Question Answered"
Group by: questionId
Metric: Percentage where isCorrect = true
```

## Testing Analytics

### Development Mode

In development (`NODE_ENV=development`), Mixpanel runs in debug mode with console logging enabled.

### Test Events

1. Start the app: `npm run dev`
2. Open browser console
3. Look for "Mixpanel initialized" message
4. Navigate through the app and verify events in console
5. Check Mixpanel dashboard for real-time events

### Verification Checklist

- [ ] Session started tracked on test page load
- [ ] Subject selection tracked from home page
- [ ] Question answered tracked when selecting options
- [ ] Answer changed tracked when changing selections
- [ ] Test completion tracked with correct metrics
- [ ] Explanation viewed tracked on results page
- [ ] Navigation tracked between pages

## Privacy & Compliance

- All tracking is anonymous by default
- No personal information is collected
- User can be identified only if logged in (not currently implemented)
- Data is stored on Mixpanel's servers
- Consider adding a privacy policy and cookie consent

## Analytics Service API

The analytics service is located at `/lib/analytics.js` and provides:

```javascript
import { analytics } from '../lib/analytics';

// Initialize (called automatically in _app.js)
analytics.init();

// Track events
analytics.trackQuestionViewed(questionData, subject);
analytics.trackQuestionAnswered(questionData, subject, selectedIndex, timeSpent, isCorrect);
analytics.trackAnswerChanged(questionData, subject, oldAnswer, newAnswer);
analytics.trackExplanationViewed(questionData, subject, wasCorrect, timeOnExplanation);
analytics.trackQuestionSkipped(questionData, subject);
analytics.trackSessionStarted(subject, testType);
analytics.trackSubjectSelected(subject, from);
analytics.trackTestCompleted(subject, totalQuestions, correctAnswers, totalTime, year);
analytics.trackAccuracyMilestone(milestone, subject);
analytics.trackNavigation(from, to);

// User identification (optional)
analytics.identifyUser(userId);
analytics.reset(); // Logout
```

## Troubleshooting

### Analytics Not Showing in Dashboard

1. Verify `NEXT_PUBLIC_MIXPANEL_TOKEN` is set correctly
2. Check browser console for errors
3. Ensure events are being fired (look for console logs in dev mode)
4. Verify Mixpanel project token is active

### Events Not Tracking

1. Check that analytics is initialized: look for "Mixpanel initialized" in console
2. Verify environment variable name starts with `NEXT_PUBLIC_`
3. Restart dev server after changing `.env`
4. Clear browser cache and localStorage

### Missing Data Properties

1. Check that all required properties are passed to tracking functions
2. Verify question data structure matches expected format
3. Check browser console for JavaScript errors

## Free Tier Limits

Mixpanel free tier includes:
- **100,000 events/month** (~3,000-5,000 question attempts)
- Unlimited data history (60 days)
- Core analytics features
- Real-time dashboards

If you exceed limits, consider:
- Upgrading to paid plan ($25/month for 1M events)
- Sampling events (track 50% of interactions)
- Reducing tracked properties

## Next Steps

1. ✅ Analytics tracking implemented
2. ⬜ Set up custom dashboards in Mixpanel
3. ⬜ Create weekly reports
4. ⬜ Set up alerts for anomalies
5. ⬜ A/B test features based on data
6. ⬜ Add user authentication for personalized tracking
7. ⬜ Implement privacy policy and cookie consent

## Support

For issues or questions:
- Mixpanel Documentation: https://docs.mixpanel.com
- Mixpanel Support: https://mixpanel.com/get-support

---

**Last Updated:** December 2025
