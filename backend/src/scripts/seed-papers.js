require('dotenv').config();
const mongoose = require('mongoose');
const Paper = require('../models/Paper');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sok_research';

// Initial papers for Browser Extension SoK Research
const initialPapers = [
  // 1. Foundational & Measurement Papers
  {
    title: "The Web's Sixth Sense: A Systematic Analysis of Browser Extension Security",
    authors: "Devdatta Akhawe, Prateek Saxena, Dawn Song",
    venue: "USENIX Security",
    year: 2014,
    readingStatus: "TO_READ",
    tags: ["Foundational", "Measurement", "Ecosystem Analysis", "Security Analysis"],
    sok: {
      category: "Foundational & Measurement",
      method: "Systematic Analysis",
      threatModel: ["Extension Vulnerabilities", "Security Architecture"],
      dataset: "Browser Extension Ecosystem",
      keyFindings: "Comprehensive security analysis of browser extension architecture",
      limitations: "Focuses on Chrome extensions primarily"
    }
  },
  {
    title: "The World Wide Web of Add-ons: Measuring the Security of the Browser Extension Ecosystem",
    authors: "Oleksii Starov, Nick Nikiforakis",
    venue: "NDSS",
    year: 2016,
    readingStatus: "TO_READ",
    tags: ["Measurement", "Ecosystem Security", "Large-scale Study"],
    sok: {
      category: "Foundational & Measurement",
      method: "Large-scale Measurement",
      threatModel: ["Ecosystem Vulnerabilities", "Security Posture"],
      dataset: "Browser Extension Ecosystem",
      keyFindings: "Large-scale security measurement of extension ecosystem",
      limitations: "Snapshot in time measurement"
    }
  },
  {
    title: "A Large-scale Study of Malicious Extensions in the Chrome Web Store",
    authors: "Abner Mendoza, Guofei Gu",
    venue: "USENIX Security",
    year: 2014,
    readingStatus: "TO_READ",
    tags: ["Malware Analysis", "Chrome Web Store", "Large-scale Study"],
    sok: {
      category: "Vulnerabilities & Malware",
      method: "Large-scale Analysis",
      threatModel: ["Malicious Extensions", "Web Store Security"],
      dataset: "Chrome Web Store Extensions",
      keyFindings: "Analysis of malicious extensions in official store",
      limitations: "Focuses on Chrome Web Store only"
    }
  },
  {
    title: "The Achilles' Heel of Web Browsers: Vulnerabilities and Stealthy Tracking",
    authors: "Moaz et al.",
    venue: "ArXiv",
    year: 2025,
    readingStatus: "TO_READ",
    tags: ["Vulnerabilities", "Tracking", "Privacy", "Stealth"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Vulnerability Analysis",
      threatModel: ["Tracking", "Privacy Violations", "Stealth Techniques"],
      dataset: "Web Browser Extensions",
      keyFindings: "Vulnerabilities enabling stealthy tracking in browsers",
      limitations: "Recent work, may need further validation"
    }
  },
  // 2. Vulnerabilities & Malware
  {
    title: "Hulk: Eliciting Malicious Behavior in Browser Extensions",
    authors: "Nan Jiang, Jianjun Chen, Guofei Gu, Junjie Zhang",
    venue: "USENIX Security",
    year: 2014,
    readingStatus: "TO_READ",
    tags: ["Malware Analysis", "Behavioral Analysis", "Malicious Extensions"],
    sok: {
      category: "Vulnerabilities & Malware",
      method: "Behavioral Analysis",
      threatModel: ["Malicious Behavior", "Extension Abuse"],
      dataset: "Browser Extensions",
      keyFindings: "Techniques to elicit malicious behavior in extensions",
      limitations: "May not catch all evasion techniques"
    }
  },
  {
    title: "Ex-Ray: Detecting Malicious Browser Extensions with Behavioral Analysis",
    authors: "Oleksii Starov, Nick Nikiforakis",
    venue: "USENIX Security",
    year: 2017,
    readingStatus: "TO_READ",
    tags: ["Malware Detection", "Behavioral Analysis", "Security"],
    sok: {
      category: "Vulnerabilities & Malware",
      method: "Behavioral Analysis",
      threatModel: ["Malicious Extensions", "Extension Behavior"],
      dataset: "Browser Extensions",
      keyFindings: "Behavioral analysis for detecting malicious extensions",
      limitations: "May have false positives"
    }
  },
  {
    title: "Ransomware over Modern Web Browsers",
    authors: "Oz et al.",
    venue: "USENIX Security",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["Ransomware", "Browser Security", "File System API", "Security"],
    sok: {
      category: "Vulnerabilities & Malware",
      method: "Vulnerability Analysis",
      threatModel: ["Ransomware", "File System API Abuse"],
      dataset: "Modern Web Browsers",
      keyFindings: "Ransomware attacks via browser extension capabilities",
      limitations: "Focuses on File System API vulnerabilities"
    }
  },
  {
    title: "Honey-X: Automated Discovery of Vulnerable Browser Extensions",
    authors: "Not specified",
    venue: "ACM CCS",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["Vulnerability Discovery", "Automation", "Honeypots"],
    sok: {
      category: "Vulnerabilities & Malware",
      method: "Automated Discovery",
      threatModel: ["Extension Vulnerabilities"],
      dataset: "Browser Extensions",
      keyFindings: "Automated discovery of vulnerable extensions",
      limitations: "Requires active extension monitoring"
    }
  },
  {
    title: "No-Jump: Extension-to-Extension Communication Security",
    authors: "Not specified",
    venue: "WWW",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["Extension Communication", "Security", "Inter-extension"],
    sok: {
      category: "Vulnerabilities & Malware",
      method: "Security Analysis",
      threatModel: ["Extension-to-Extension Communication", "Message Passing"],
      dataset: "Browser Extensions",
      keyFindings: "Security issues in extension communication mechanisms",
      limitations: "Focuses on communication protocols"
    }
  },
  // 3. Privacy & Fingerprinting
  {
    title: "Who-Is-Extension: Evaluating the Privacy Risk of Browser Extensions",
    authors: "Not specified",
    venue: "ACM CCS",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Privacy", "Risk Assessment", "Extension Privacy"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Privacy Risk Evaluation",
      threatModel: ["Privacy Violations", "Data Leakage"],
      dataset: "Browser Extensions",
      keyFindings: "Evaluation of privacy risks in browser extensions",
      limitations: "Risk assessment may vary by use case"
    }
  },
  {
    title: "Characterizing Browser Extension Fingerprinting",
    authors: "Not specified",
    venue: "PETS",
    year: 2017,
    readingStatus: "TO_READ",
    tags: ["Fingerprinting", "Privacy", "Characterization"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Fingerprinting Analysis",
      threatModel: ["Browser Fingerprinting", "Privacy"],
      dataset: "Browser Extensions",
      keyFindings: "Characterization of extension-based fingerprinting",
      limitations: "May not cover all fingerprinting techniques"
    }
  },
  {
    title: "Beauty and the Beast: Diverting modern web browsers with extensions",
    authors: "Not specified",
    venue: "IEEE S&P",
    year: 2016,
    readingStatus: "TO_READ",
    tags: ["Browser Manipulation", "Extensions", "Security"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Security Analysis",
      threatModel: ["Browser Manipulation", "Extension Abuse"],
      dataset: "Modern Web Browsers",
      keyFindings: "Ways extensions can divert browser behavior",
      limitations: "Older work, may not reflect current browser security"
    }
  },
  {
    title: "Extension-based Web Tracking: Trends and Countermeasures",
    authors: "Not specified",
    venue: "WWW",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Web Tracking", "Privacy", "Countermeasures", "Trends"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Trend Analysis",
      threatModel: ["Web Tracking", "Privacy Violations"],
      dataset: "Browser Extensions",
      keyFindings: "Trends in extension-based tracking and countermeasures",
      limitations: "Tracking techniques evolve rapidly"
    }
  },
  // 4. Detection & Analysis Techniques
  {
    title: "DoubleX: Statically Detecting Vulnerable Browser Extensions",
    authors: "Not specified",
    venue: "ACM CCS",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["Static Analysis", "Vulnerability Detection", "Security"],
    sok: {
      category: "Detection & Analysis Techniques",
      method: "Static Analysis",
      threatModel: ["Extension Vulnerabilities"],
      dataset: "Browser Extensions",
      keyFindings: "Static analysis for detecting vulnerable extensions",
      limitations: "May miss dynamic vulnerabilities"
    }
  },
  {
    title: "ExtenSpy: Discovering Information Leaks in Browser Extensions",
    authors: "Not specified",
    venue: "ESORICS",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Information Leakage", "Detection", "Privacy"],
    sok: {
      category: "Detection & Analysis Techniques",
      method: "Information Leak Detection",
      threatModel: ["Information Leakage", "Data Exfiltration"],
      dataset: "Browser Extensions",
      keyFindings: "Discovery of information leaks in extensions",
      limitations: "Focuses on specific leak patterns"
    }
  },
  {
    title: "B-Sieve: A Scalable Framework for Detecting Malicious Extensions",
    authors: "Not specified",
    venue: "AsiaCCS",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Malware Detection", "Scalable Framework", "Security"],
    sok: {
      category: "Detection & Analysis Techniques",
      method: "Scalable Detection Framework",
      threatModel: ["Malicious Extensions"],
      dataset: "Browser Extensions",
      keyFindings: "Scalable framework for detecting malicious extensions",
      limitations: "May require significant computational resources"
    }
  },
  {
    title: "CrawlMeMaybe: Detecting Browser Extension Identification",
    authors: "Not specified",
    venue: "NDSS",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["Extension Identification", "Fingerprinting", "Detection"],
    sok: {
      category: "Detection & Analysis Techniques",
      method: "Identification Detection",
      threatModel: ["Extension Identification", "Fingerprinting"],
      dataset: "Browser Extensions",
      keyFindings: "Detection of extension identification techniques",
      limitations: "Focuses on identification methods"
    }
  },
  {
    title: "Static Analysis of Browser Extensions: Challenges and Opportunities",
    authors: "Not specified",
    venue: "EuroS&P",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Static Analysis", "Challenges", "Opportunities"],
    sok: {
      category: "Detection & Analysis Techniques",
      method: "Static Analysis Survey",
      threatModel: ["Extension Security"],
      dataset: "Browser Extensions",
      keyFindings: "Challenges and opportunities in static analysis of extensions",
      limitations: "Survey paper, not primary research"
    }
  },
  // 5. Modern Trends & Manifest V3
  {
    title: "All Your Screens belong to Us: Attacks on Browser Extension APIs",
    authors: "Not specified",
    venue: "USENIX Security",
    year: 2014,
    readingStatus: "TO_READ",
    tags: ["API Attacks", "Extension APIs", "Security", "Manifest V2"],
    sok: {
      category: "Modern Trends & Manifest V3",
      method: "API Security Analysis",
      threatModel: ["API Abuse", "Extension APIs"],
      dataset: "Browser Extension APIs",
      keyFindings: "Attacks on browser extension APIs (pre-V3)",
      limitations: "Based on Manifest V2, may not reflect V3 changes"
    }
  },
  {
    title: "Security and Privacy Implications of Manifest V3",
    authors: "Not specified",
    venue: "W2SP",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Manifest V3", "Security", "Privacy", "Implications"],
    sok: {
      category: "Modern Trends & Manifest V3",
      method: "Security Analysis",
      threatModel: ["Manifest V3 Security", "Privacy Implications"],
      dataset: "Manifest V3 Extensions",
      keyFindings: "Security and privacy implications of Manifest V3",
      limitations: "Early analysis of V3, ecosystem still evolving"
    }
  },
  {
    title: "WebExtensions API Security: A Comprehensive Study",
    authors: "Not specified",
    venue: "IEEE Access",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["WebExtensions API", "Security", "Comprehensive Study"],
    sok: {
      category: "Modern Trends & Manifest V3",
      method: "Comprehensive Security Study",
      threatModel: ["WebExtensions API Security"],
      dataset: "WebExtensions API",
      keyFindings: "Comprehensive study of WebExtensions API security",
      limitations: "May not cover all API endpoints"
    }
  },
  {
    title: "Ex-Chain: Identifying Extension Chaining Vulnerabilities",
    authors: "Not specified",
    venue: "USENIX Security",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["Extension Chaining", "Vulnerabilities", "Security"],
    sok: {
      category: "Modern Trends & Manifest V3",
      method: "Vulnerability Identification",
      threatModel: ["Extension Chaining", "Chain Attacks"],
      dataset: "Browser Extensions",
      keyFindings: "Identification of extension chaining vulnerabilities",
      limitations: "Focuses on chaining-specific vulnerabilities"
    }
  }
];

async function seedPapers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if papers already exist
    const existingPapers = await Paper.countDocuments();
    if (existingPapers > 0) {
      console.log(`Database already contains ${existingPapers} papers. Skipping seed.`);
      console.log('To re-seed, please clear the papers collection first.');
      await mongoose.disconnect();
      return;
    }

    // Find or create a super admin user to assign as creator
    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!adminUser) {
      // Try to find any user
      adminUser = await User.findOne({ status: 'APPROVED' });
    }

    if (!adminUser) {
      console.error('No user found to assign papers to. Please create a user first.');
      await mongoose.disconnect();
      return;
    }

    // Add createdByUserId to all papers
    const papersToInsert = initialPapers.map(paper => ({
      ...paper,
      createdByUserId: adminUser._id
    }));

    const insertedPapers = await Paper.insertMany(papersToInsert);
    console.log(`✓ Successfully seeded ${insertedPapers.length} papers into the database`);
    console.log(`Papers assigned to user: ${adminUser.username} (${adminUser.displayName})`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error seeding papers:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedPapers();
}

module.exports = { seedPapers, initialPapers };

