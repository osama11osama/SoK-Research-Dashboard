# Initial Seed Data for SoK Research Dashboard

This document describes the initial papers that are seeded into the database when it's first created.

## Browser Extension SoK Research - 22 Initial Papers

The seed data includes 22 foundational papers on browser extension security, organized into 5 categories:

### 1. Foundational & Measurement (4 papers)
- The Web's Sixth Sense: A Systematic Analysis of Browser Extension Security (USENIX Security '14)
- The World Wide Web of Add-ons: Measuring the Security of the Browser Extension Ecosystem (NDSS '16)
- A Large-scale Study of Malicious Extensions in the Chrome Web Store (USENIX Security '14)
- The Achilles' Heel of Web Browsers: Vulnerabilities and Stealthy Tracking (ArXiv '25)

### 2. Vulnerabilities & Malware (5 papers)
- Hulk: Eliciting Malicious Behavior in Browser Extensions (USENIX Security '14)
- Ex-Ray: Detecting Malicious Browser Extensions with Behavioral Analysis (USENIX Security '17)
- Ransomware over Modern Web Browsers (USENIX Security '23)
- Honey-X: Automated Discovery of Vulnerable Browser Extensions (ACM CCS '23)
- No-Jump: Extension-to-Extension Communication Security (WWW '20)

### 3. Privacy & Fingerprinting (4 papers)
- Who-Is-Extension: Evaluating the Privacy Risk of Browser Extensions (ACM CCS '21)
- Characterizing Browser Extension Fingerprinting (PETS '17)
- Beauty and the Beast: Diverting modern web browsers with extensions (IEEE S&P '16)
- Extension-based Web Tracking: Trends and Countermeasures (WWW '21)

### 4. Detection & Analysis Techniques (5 papers)
- DoubleX: Statically Detecting Vulnerable Browser Extensions (ACM CCS '20)
- ExtenSpy: Discovering Information Leaks in Browser Extensions (ESORICS '22)
- B-Sieve: A Scalable Framework for Detecting Malicious Extensions (AsiaCCS '22)
- CrawlMeMaybe: Detecting Browser Extension Identification (NDSS '23)
- Static Analysis of Browser Extensions: Challenges and Opportunities (EuroS&P '21)

### 5. Modern Trends & Manifest V3 (4 papers)
- All Your Screens belong to Us: Attacks on Browser Extension APIs (USENIX Security '14)
- Security and Privacy Implications of Manifest V3 (W2SP '22)
- WebExtensions API Security: A Comprehensive Study (IEEE Access '22)
- Ex-Chain: Identifying Extension Chaining Vulnerabilities (USENIX Security '23)

## Tag Categories

Papers are tagged with relevant categories:
- **Foundational** - Core research establishing the field
- **Measurement** - Large-scale studies and measurements
- **Malware Analysis** - Studies of malicious extensions
- **Privacy** - Privacy-related research
- **Fingerprinting** - Browser fingerprinting studies
- **Static Analysis** - Static analysis techniques
- **Dynamic Analysis** - Dynamic analysis techniques
- **Manifest V3** - Research on Manifest V3
- **Security** - General security research
- And more...

## How to Seed the Database

### Option 1: Manual Seed (Recommended)
```bash
cd backend
npm run seed-papers
```

### Option 2: Auto-seed on Server Start
Set the environment variable:
```bash
AUTO_SEED_PAPERS=true npm start
```

Or add to your `.env` file:
```
AUTO_SEED_PAPERS=true
```

**Note:** Auto-seeding only runs if the database is empty (no papers exist).

### Option 3: Complete Setup (Admin + Papers)
```bash
cd backend
npm run setup
```

This will:
1. Create the initial SUPER_ADMIN user (if needed)
2. Seed all 22 initial papers

## Paper Data Structure

Each paper includes:
- **Basic Information**: Title, Authors, Venue, Year
- **Reading Status**: TO_READ (default)
- **Tags**: Categorized tags for easy filtering
- **SoK Metadata**: 
  - Category (one of the 5 main categories)
  - Method (research method used)
  - Threat Model (security threats addressed)
  - Dataset (data used in the study)
  - Key Findings (brief summary)
  - Limitations (known limitations)

## Customization

To modify the seed data:
1. Edit `backend/src/scripts/seed-papers.js`
2. Modify the `initialPapers` array
3. Run `npm run seed-papers` again (or clear the database first)

## Notes

- Papers are assigned to the first SUPER_ADMIN user found, or first APPROVED user if no admin exists
- All papers start with `readingStatus: "TO_READ"`
- Links to PDFs are not included in seed data - you can add them manually through the UI
- SoK metadata provides a starting point but should be updated as you read and analyze each paper

