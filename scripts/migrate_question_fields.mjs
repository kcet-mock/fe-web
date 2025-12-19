#!/usr/bin/env node

/**
 * Migration script to update question JSON files:
 * - options -> choices
 * - answer -> correctAnswer (convert from 1-based to 0-based)
 * - explaination -> explanation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const SUBJECTS = ['bio', 'chem', 'mat', 'phy'];

function migrateQuestion(questionPath) {
  try {
    const content = fs.readFileSync(questionPath, 'utf-8');
    const question = JSON.parse(content);
    
    let updated = false;
    
    // Rename options to choices
    if (question.options !== undefined) {
      question.choices = question.options;
      delete question.options;
      updated = true;
    }
    
    // Rename answer to correctAnswer and convert from 1-based to 0-based
    if (question.answer !== undefined) {
      // Convert 1-based to 0-based index
      question.correctAnswer = typeof question.answer === 'number' ? question.answer - 1 : 0;
      delete question.answer;
      updated = true;
    }
    
    // Rename explaination to explanation
    if (question.explaination !== undefined) {
      question.explanation = question.explaination;
      delete question.explaination;
      updated = true;
    }
    
    if (updated) {
      // Write back with proper formatting
      fs.writeFileSync(questionPath, JSON.stringify(question, null, 2) + '\n', 'utf-8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${questionPath}:`, error.message);
    return false;
  }
}

function migrateSubject(subject) {
  const subjectDir = path.join(DATA_DIR, subject);
  
  if (!fs.existsSync(subjectDir)) {
    console.log(`Skipping ${subject}: directory not found`);
    return { total: 0, updated: 0 };
  }
  
  const files = fs.readdirSync(subjectDir);
  const jsonFiles = files.filter(f => f.endsWith('.json') && f !== '_all.json');
  
  let updatedCount = 0;
  
  for (const file of jsonFiles) {
    const filePath = path.join(subjectDir, file);
    if (migrateQuestion(filePath)) {
      updatedCount++;
    }
  }
  
  return { total: jsonFiles.length, updated: updatedCount };
}

function main() {
  console.log('Starting question migration...\n');
  
  let totalFiles = 0;
  let totalUpdated = 0;
  
  for (const subject of SUBJECTS) {
    const { total, updated } = migrateSubject(subject);
    totalFiles += total;
    totalUpdated += updated;
    console.log(`${subject}: ${updated}/${total} files updated`);
  }
  
  console.log(`\nMigration complete: ${totalUpdated}/${totalFiles} files updated`);
}

main();
