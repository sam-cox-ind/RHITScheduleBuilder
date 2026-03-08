# RHIT Schedule Builder

Originally Developed: Spring 2023 
Refactored: Spring 2026

Team: Sam Cox & Jonathan David

Note: Project was developed with outdated dependencies to Rose Authentication, and consequently is in a non-working state

---

## Overview

RHIT Schedule Builder is a web app that helps Rose-Hulman students build and manage academic schedules by quarter.  
Users can:

- Create schedules and name them
- Add class CRNs to schedules
- View schedule details
- Edit existing schedules
- Filter schedules by quarter (Fall, Winter/Spring, Summer)
- Search class data by course/professor/department

---

## Tech Stack

- HTML/CSS/JavaScript
- Bootstrap Material Design
- jQuery
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting

---

## Project Structure

- `public/schedules.html` – schedule list view
- `public/singleSchedule.html` – single schedule detail/edit view
- `public/scheduleBuilder.html` – schedule builder page
- `public/classLookup.html` – class search page
- `public/scripts/main.js` – main client-side app logic
- `public/data/*.json` – class data by quarter
- `firebase.json`, `firestore.rules`, `firestore.indexes.json` – Firebase configuration

---
