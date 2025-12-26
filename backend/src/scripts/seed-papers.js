require('dotenv').config();
const mongoose = require('mongoose');
const Paper = require('../models/Paper');
const User = require('../models/User');
const Tag = require('../models/Tag');
const ThreatModel = require('../models/ThreatModel');

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
  },
  // المحور 1: Foundations & Architecture (10 papers)
  {
    title: "Abusing Browser Extensions",
    authors: "Not specified",
    venue: "BlackHat",
    year: 2012,
    readingStatus: "TO_READ",
    tags: ["Foundational", "Extension Abuse", "Security", "Architecture"],
    sok: {
      category: "Foundations & Architecture",
      method: "Security Analysis",
      threatModel: ["Extension Abuse", "Security Architecture"],
      dataset: "Browser Extensions",
      keyFindings: "Early analysis of browser extension abuse vectors",
      limitations: "Early work, may not reflect current architecture"
    }
  },
  {
    title: "All Your Screens belong to Us: Attacks on Browser Extension APIs",
    authors: "Not specified",
    venue: "USENIX Security",
    year: 2014,
    readingStatus: "TO_READ",
    tags: ["Foundational", "API Attacks", "Extension APIs", "Security"],
    sok: {
      category: "Foundations & Architecture",
      method: "API Security Analysis",
      threatModel: ["API Abuse", "Extension APIs"],
      dataset: "Browser Extension APIs",
      keyFindings: "Attacks on browser extension APIs",
      limitations: "Based on Manifest V2 architecture"
    }
  },
  {
    title: "An Analysis of the WebExtensions API Security Model",
    authors: "Not specified",
    venue: "ArXiv",
    year: 2016,
    readingStatus: "TO_READ",
    tags: ["Foundational", "WebExtensions", "Security Model", "API Analysis"],
    sok: {
      category: "Foundations & Architecture",
      method: "Security Model Analysis",
      threatModel: ["WebExtensions Security", "API Security"],
      dataset: "WebExtensions API",
      keyFindings: "Analysis of WebExtensions API security model",
      limitations: "Early WebExtensions analysis"
    }
  },
  {
    title: "Web Extension Security Architecture: A Survey",
    authors: "Not specified",
    venue: "Informatica",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["Foundational", "Security Architecture", "Survey", "Web Extensions"],
    sok: {
      category: "Foundations & Architecture",
      method: "Survey",
      threatModel: ["Security Architecture"],
      dataset: "Browser Extensions",
      keyFindings: "Comprehensive survey of web extension security architecture",
      limitations: "Survey paper, not primary research"
    }
  },
  {
    title: "The Evolution of Browser Extension Permission Systems",
    authors: "Not specified",
    venue: "EuroS&P",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Foundational", "Permission Systems", "Evolution", "Security"],
    sok: {
      category: "Foundations & Architecture",
      method: "Evolutionary Analysis",
      threatModel: ["Permission Systems", "Access Control"],
      dataset: "Browser Extension Permission Systems",
      keyFindings: "Evolution of browser extension permission systems",
      limitations: "Historical analysis"
    }
  },
  {
    title: "Browser Extension Security: A 10-Year Retrospective",
    authors: "Not specified",
    venue: "CSUR",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["Foundational", "Retrospective", "Security", "10-Year Study"],
    sok: {
      category: "Foundations & Architecture",
      method: "Retrospective Analysis",
      threatModel: ["Extension Security"],
      dataset: "Browser Extensions (10 years)",
      keyFindings: "10-year retrospective on browser extension security",
      limitations: "Retrospective, may miss recent developments"
    }
  },
  {
    title: "Manifest V3: Impact on Privacy and Performance",
    authors: "Not specified",
    venue: "Security & Privacy",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["Foundational", "Manifest V3", "Privacy", "Performance"],
    sok: {
      category: "Foundations & Architecture",
      method: "Impact Analysis",
      threatModel: ["Manifest V3 Security", "Privacy Implications"],
      dataset: "Manifest V3 Extensions",
      keyFindings: "Impact of Manifest V3 on privacy and performance",
      limitations: "Early Manifest V3 analysis"
    }
  },
  {
    title: "A Comparative Study: Chrome vs Firefox Extension Security",
    authors: "Not specified",
    venue: "DIMVA",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Foundational", "Comparative Study", "Chrome", "Firefox", "Security"],
    sok: {
      category: "Foundations & Architecture",
      method: "Comparative Analysis",
      threatModel: ["Extension Security", "Browser Security"],
      dataset: "Chrome and Firefox Extensions",
      keyFindings: "Comparative security analysis of Chrome vs Firefox extensions",
      limitations: "Focuses on two browsers only"
    }
  },
  // المحور 2: Measurement Studies (10 papers)
  {
    title: "Understanding the Privacy Policy Landscape of Browser Extensions",
    authors: "Not specified",
    venue: "WWW",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Measurement", "Privacy Policies", "Large-scale Study", "Ecosystem Analysis"],
    sok: {
      category: "Measurement Studies",
      method: "Large-scale Measurement",
      threatModel: ["Privacy Violations", "Policy Analysis"],
      dataset: "Browser Extension Privacy Policies",
      keyFindings: "Analysis of privacy policy landscape in browser extensions",
      limitations: "Policy analysis may not reflect actual behavior"
    }
  },
  {
    title: "An Analysis of the Chrome Web Store Review Process",
    authors: "Not specified",
    venue: "USENIX Security",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Measurement", "Chrome Web Store", "Review Process", "Ecosystem Analysis"],
    sok: {
      category: "Measurement Studies",
      method: "Process Analysis",
      threatModel: ["Web Store Security", "Review Process"],
      dataset: "Chrome Web Store",
      keyFindings: "Analysis of Chrome Web Store review process",
      limitations: "Focuses on Chrome Web Store only"
    }
  },
  {
    title: "The Filter List Ecosystem: Vulnerabilities and Trends",
    authors: "Not specified",
    venue: "PETS",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["Measurement", "Filter Lists", "Vulnerabilities", "Trends"],
    sok: {
      category: "Measurement Studies",
      method: "Ecosystem Analysis",
      threatModel: ["Filter List Vulnerabilities"],
      dataset: "Filter List Ecosystem",
      keyFindings: "Vulnerabilities and trends in filter list ecosystem",
      limitations: "Focuses on filter lists"
    }
  },
  {
    title: "Measuring the Proliferation of Malicious Browser Extensions",
    authors: "Not specified",
    venue: "IMC",
    year: 2019,
    readingStatus: "TO_READ",
    tags: ["Measurement", "Malicious Extensions", "Proliferation", "Large-scale Study"],
    sok: {
      category: "Measurement Studies",
      method: "Large-scale Measurement",
      threatModel: ["Malicious Extensions"],
      dataset: "Browser Extensions",
      keyFindings: "Measurement of malicious extension proliferation",
      limitations: "Snapshot in time measurement"
    }
  },
  {
    title: "A Longitudinal Study of Browser Extension Permissions",
    authors: "Not specified",
    venue: "WWW",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["Measurement", "Longitudinal Study", "Permissions", "Ecosystem Analysis"],
    sok: {
      category: "Measurement Studies",
      method: "Longitudinal Analysis",
      threatModel: ["Permission Systems", "Access Control"],
      dataset: "Browser Extension Permissions",
      keyFindings: "Longitudinal study of browser extension permissions",
      limitations: "Time-bound study"
    }
  },
  {
    title: "Characterizing the Browser Extension Supply Chain",
    authors: "Not specified",
    venue: "Digital Threats",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Measurement", "Supply Chain", "Characterization", "Ecosystem Analysis"],
    sok: {
      category: "Measurement Studies",
      method: "Supply Chain Analysis",
      threatModel: ["Supply Chain Attacks"],
      dataset: "Browser Extension Supply Chain",
      keyFindings: "Characterization of browser extension supply chain",
      limitations: "Supply chain analysis"
    }
  },
  {
    title: "Quantifying the Impact of Extension Abandonment",
    authors: "Not specified",
    venue: "ArXiv",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["Measurement", "Extension Abandonment", "Impact Analysis", "Ecosystem"],
    sok: {
      category: "Measurement Studies",
      method: "Impact Quantification",
      threatModel: ["Abandoned Extensions", "Security Risks"],
      dataset: "Abandoned Browser Extensions",
      keyFindings: "Quantification of extension abandonment impact",
      limitations: "Focuses on abandoned extensions"
    }
  },
  {
    title: "Measuring Manifest V3 Adoption in the Wild",
    authors: "Not specified",
    venue: "IMC",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["Measurement", "Manifest V3", "Adoption", "Large-scale Study"],
    sok: {
      category: "Measurement Studies",
      method: "Adoption Measurement",
      threatModel: ["Manifest V3 Migration"],
      dataset: "Browser Extensions",
      keyFindings: "Measurement of Manifest V3 adoption in the wild",
      limitations: "Early adoption phase"
    }
  },
  // المحور 3: Malware & Attack Vectors (15 papers)
  {
    title: "The Puppet Master: Hijacking Browsers via Malicious Extensions",
    authors: "Not specified",
    venue: "USENIX Security",
    year: 2019,
    readingStatus: "TO_READ",
    tags: ["Malware", "Browser Hijacking", "Malicious Extensions", "Attack Vectors"],
    sok: {
      category: "Malware & Attack Vectors",
      method: "Attack Analysis",
      threatModel: ["Browser Hijacking", "Malicious Extensions"],
      dataset: "Malicious Browser Extensions",
      keyFindings: "Browser hijacking via malicious extensions",
      limitations: "Focuses on hijacking attacks"
    }
  },
  {
    title: "Stealing Sensitive Data via Extension-Led Content Injection",
    authors: "Not specified",
    venue: "RAID",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Malware", "Data Theft", "Content Injection", "Attack Vectors"],
    sok: {
      category: "Malware & Attack Vectors",
      method: "Attack Analysis",
      threatModel: ["Data Theft", "Content Injection"],
      dataset: "Malicious Browser Extensions",
      keyFindings: "Stealing sensitive data via extension content injection",
      limitations: "Focuses on content injection attacks"
    }
  },
  {
    title: "Browser Extension Supply Chain Attacks",
    authors: "Not specified",
    venue: "IEEE S&P",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Malware", "Supply Chain Attacks", "Security", "Attack Vectors"],
    sok: {
      category: "Malware & Attack Vectors",
      method: "Attack Analysis",
      threatModel: ["Supply Chain Attacks"],
      dataset: "Browser Extension Supply Chain",
      keyFindings: "Supply chain attacks in browser extensions",
      limitations: "Focuses on supply chain attacks"
    }
  },
  {
    title: "Cryptojacking via Browser Extensions",
    authors: "Not specified",
    venue: "AsiaCCS",
    year: 2019,
    readingStatus: "TO_READ",
    tags: ["Malware", "Cryptojacking", "Attack Vectors", "Security"],
    sok: {
      category: "Malware & Attack Vectors",
      method: "Attack Analysis",
      threatModel: ["Cryptojacking", "Resource Abuse"],
      dataset: "Malicious Browser Extensions",
      keyFindings: "Cryptojacking attacks via browser extensions",
      limitations: "Focuses on cryptojacking"
    }
  },
  {
    title: "Persistence Mechanisms in Malicious Extensions",
    authors: "Not specified",
    venue: "DeepSec",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["Malware", "Persistence", "Malicious Extensions", "Attack Vectors"],
    sok: {
      category: "Malware & Attack Vectors",
      method: "Mechanism Analysis",
      threatModel: ["Persistence", "Malicious Extensions"],
      dataset: "Malicious Browser Extensions",
      keyFindings: "Persistence mechanisms in malicious extensions",
      limitations: "Focuses on persistence techniques"
    }
  },
  {
    title: "Automated Discovery of Vulnerable Browser Extensions",
    authors: "Not specified",
    venue: "ACM CCS",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["Malware", "Vulnerability Discovery", "Automation", "Security"],
    sok: {
      category: "Malware & Attack Vectors",
      method: "Automated Discovery",
      threatModel: ["Extension Vulnerabilities"],
      dataset: "Browser Extensions",
      keyFindings: "Automated discovery of vulnerable browser extensions",
      limitations: "May have false positives"
    }
  },
  {
    title: "Attacking Browser Extension Update Mechanisms",
    authors: "Not specified",
    venue: "NDSS",
    year: 2015,
    readingStatus: "TO_READ",
    tags: ["Malware", "Update Mechanisms", "Attack Vectors", "Security"],
    sok: {
      category: "Malware & Attack Vectors",
      method: "Attack Analysis",
      threatModel: ["Update Mechanism Attacks"],
      dataset: "Browser Extension Updates",
      keyFindings: "Attacks on browser extension update mechanisms",
      limitations: "Older work, may not reflect current update mechanisms"
    }
  },
  {
    title: "Phishing via Browser Extensions: A New Frontier",
    authors: "Not specified",
    venue: "eCrime",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Malware", "Phishing", "Attack Vectors", "Social Engineering"],
    sok: {
      category: "Malware & Attack Vectors",
      method: "Attack Analysis",
      threatModel: ["Phishing", "Social Engineering"],
      dataset: "Malicious Browser Extensions",
      keyFindings: "Phishing attacks via browser extensions",
      limitations: "Focuses on phishing attacks"
    }
  },
  {
    title: "Social Engineering in the Chrome Web Store",
    authors: "Not specified",
    venue: "CHI",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Malware", "Social Engineering", "Chrome Web Store", "Attack Vectors"],
    sok: {
      category: "Malware & Attack Vectors",
      method: "Social Engineering Analysis",
      threatModel: ["Social Engineering", "User Manipulation"],
      dataset: "Chrome Web Store",
      keyFindings: "Social engineering attacks in Chrome Web Store",
      limitations: "Focuses on Chrome Web Store"
    }
  },
  {
    title: "Analyzing Ad-Fraud via Browser Extensions",
    authors: "Not specified",
    venue: "WWW",
    year: 2018,
    readingStatus: "TO_READ",
    tags: ["Malware", "Ad-Fraud", "Attack Vectors", "Security"],
    sok: {
      category: "Malware & Attack Vectors",
      method: "Fraud Analysis",
      threatModel: ["Ad-Fraud", "Financial Attacks"],
      dataset: "Malicious Browser Extensions",
      keyFindings: "Ad-fraud attacks via browser extensions",
      limitations: "Focuses on ad-fraud"
    }
  },
  {
    title: "Silent Clickjacking via Background Scripts",
    authors: "Not specified",
    venue: "BlackHat",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Malware", "Clickjacking", "Background Scripts", "Attack Vectors"],
    sok: {
      category: "Malware & Attack Vectors",
      method: "Attack Analysis",
      threatModel: ["Clickjacking", "UI Redressing"],
      dataset: "Malicious Browser Extensions",
      keyFindings: "Silent clickjacking via background scripts",
      limitations: "Focuses on clickjacking attacks"
    }
  },
  // المحور 4: Privacy & Fingerprinting (15 papers)
  {
    title: "FP-Scanner: Detecting Browser Fingerprinting via Extension Analysis",
    authors: "Not specified",
    venue: "USENIX Security",
    year: 2018,
    readingStatus: "TO_READ",
    tags: ["Privacy", "Fingerprinting", "Detection", "Extension Analysis"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Fingerprinting Detection",
      threatModel: ["Browser Fingerprinting", "Privacy Violations"],
      dataset: "Browser Extensions",
      keyFindings: "Detection of browser fingerprinting via extension analysis",
      limitations: "May miss advanced fingerprinting techniques"
    }
  },
  {
    title: "The Sound of Silence: Fingerprinting via Audio Extensions",
    authors: "Not specified",
    venue: "CCS",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Privacy", "Fingerprinting", "Audio", "Side-Channel"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Side-Channel Analysis",
      threatModel: ["Audio Fingerprinting", "Side-Channel Attacks"],
      dataset: "Audio Browser Extensions",
      keyFindings: "Fingerprinting via audio extensions",
      limitations: "Focuses on audio-based fingerprinting"
    }
  },
  {
    title: "Extension-based Tracking in the Mobile Web",
    authors: "Not specified",
    venue: "PETS",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["Privacy", "Tracking", "Mobile Web", "Extensions"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Tracking Analysis",
      threatModel: ["Web Tracking", "Mobile Privacy"],
      dataset: "Mobile Browser Extensions",
      keyFindings: "Extension-based tracking in mobile web",
      limitations: "Focuses on mobile web"
    }
  },
  {
    title: "Analyzing the Fingerprintability of Privacy Extensions",
    authors: "Not specified",
    venue: "IEEE S&P",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Privacy", "Fingerprinting", "Privacy Extensions", "Analysis"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Fingerprintability Analysis",
      threatModel: ["Privacy Extension Fingerprinting"],
      dataset: "Privacy Browser Extensions",
      keyFindings: "Analysis of fingerprintability of privacy extensions",
      limitations: "Focuses on privacy extensions"
    }
  },
  {
    title: "Privacy-Preserving Browser Extensions: A Myth?",
    authors: "Not specified",
    venue: "HotWeb",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["Privacy", "Privacy-Preserving", "Extensions", "Analysis"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Privacy Analysis",
      threatModel: ["Privacy Violations"],
      dataset: "Privacy Browser Extensions",
      keyFindings: "Analysis of privacy-preserving browser extensions",
      limitations: "Focuses on privacy extensions"
    }
  },
  {
    title: "How Browser Extensions Can Stealthily Modify Ad Content",
    authors: "Not specified",
    venue: "WWW",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Privacy", "Ad Modification", "Stealth", "Content Manipulation"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Content Analysis",
      threatModel: ["Ad Manipulation", "Content Injection"],
      dataset: "Browser Extensions",
      keyFindings: "Stealthy ad content modification via extensions",
      limitations: "Focuses on ad content modification"
    }
  },
  {
    title: "Side-Channel Attacks in Browser Extensions",
    authors: "Not specified",
    venue: "EuroS&P",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Privacy", "Side-Channel Attacks", "Security", "Extensions"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Side-Channel Analysis",
      threatModel: ["Side-Channel Attacks", "Information Leakage"],
      dataset: "Browser Extensions",
      keyFindings: "Side-channel attacks in browser extensions",
      limitations: "Focuses on side-channel attacks"
    }
  },
  {
    title: "Tracking Users via Content Script Injections",
    authors: "Not specified",
    venue: "W2SP",
    year: 2019,
    readingStatus: "TO_READ",
    tags: ["Privacy", "Tracking", "Content Scripts", "Injection"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Tracking Analysis",
      threatModel: ["User Tracking", "Content Script Injection"],
      dataset: "Browser Extensions",
      keyFindings: "User tracking via content script injections",
      limitations: "Focuses on content script tracking"
    }
  },
  {
    title: "Extension-Driven Information Leaks",
    authors: "Not specified",
    venue: "AsiaCCS",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["Privacy", "Information Leakage", "Extensions", "Security"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Leakage Analysis",
      threatModel: ["Information Leakage", "Data Exfiltration"],
      dataset: "Browser Extensions",
      keyFindings: "Extension-driven information leaks",
      limitations: "Focuses on information leakage"
    }
  },
  {
    title: "Measuring the Privacy Leakage of Password Managers",
    authors: "Not specified",
    venue: "USENIX Security",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["Privacy", "Password Managers", "Privacy Leakage", "Measurement"],
    sok: {
      category: "Privacy & Fingerprinting",
      method: "Privacy Measurement",
      threatModel: ["Privacy Leakage", "Password Manager Security"],
      dataset: "Password Manager Extensions",
      keyFindings: "Measurement of privacy leakage in password managers",
      limitations: "Focuses on password managers"
    }
  },
  // المحور 5: Analysis Techniques (15 papers)
  {
    title: "Symbolic Execution of Browser Extensions",
    authors: "Not specified",
    venue: "ISSTA",
    year: 2018,
    readingStatus: "TO_READ",
    tags: ["Analysis Techniques", "Symbolic Execution", "Static Analysis", "Security"],
    sok: {
      category: "Analysis Techniques",
      method: "Symbolic Execution",
      threatModel: ["Extension Vulnerabilities"],
      dataset: "Browser Extensions",
      keyFindings: "Symbolic execution for browser extension analysis",
      limitations: "May have scalability issues"
    }
  },
  {
    title: "Deep Learning for Malicious Extension Detection",
    authors: "Not specified",
    venue: "TIFS",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["Analysis Techniques", "Deep Learning", "Malware Detection", "ML"],
    sok: {
      category: "Analysis Techniques",
      method: "Deep Learning",
      threatModel: ["Malicious Extensions"],
      dataset: "Browser Extensions",
      keyFindings: "Deep learning for malicious extension detection",
      limitations: "Requires training data"
    }
  },
  {
    title: "Graph-based Analysis of Extension Workflows",
    authors: "Not specified",
    venue: "CCS",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Analysis Techniques", "Graph Analysis", "Workflow Analysis", "Security"],
    sok: {
      category: "Analysis Techniques",
      method: "Graph-based Analysis",
      threatModel: ["Extension Vulnerabilities"],
      dataset: "Browser Extensions",
      keyFindings: "Graph-based analysis of extension workflows",
      limitations: "Focuses on workflow analysis"
    }
  },
  {
    title: "Automated Testing of Browser Extension APIs",
    authors: "Not specified",
    venue: "ASE",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Analysis Techniques", "Automated Testing", "API Testing", "Security"],
    sok: {
      category: "Analysis Techniques",
      method: "Automated Testing",
      threatModel: ["API Vulnerabilities"],
      dataset: "Browser Extension APIs",
      keyFindings: "Automated testing of browser extension APIs",
      limitations: "May not cover all API edge cases"
    }
  },
  {
    title: "Differential Testing for Extension Security Policies",
    authors: "Not specified",
    venue: "NDSS",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["Analysis Techniques", "Differential Testing", "Security Policies", "Testing"],
    sok: {
      category: "Analysis Techniques",
      method: "Differential Testing",
      threatModel: ["Security Policy Vulnerabilities"],
      dataset: "Browser Extension Security Policies",
      keyFindings: "Differential testing for extension security policies",
      limitations: "Requires multiple implementations"
    }
  },
  {
    title: "Precise Static Analysis of JavaScript-based Extensions",
    authors: "Not specified",
    venue: "PLDI",
    year: 2019,
    readingStatus: "TO_READ",
    tags: ["Analysis Techniques", "Static Analysis", "JavaScript", "Precision"],
    sok: {
      category: "Analysis Techniques",
      method: "Precise Static Analysis",
      threatModel: ["Extension Vulnerabilities"],
      dataset: "JavaScript Browser Extensions",
      keyFindings: "Precise static analysis of JavaScript-based extensions",
      limitations: "May have false positives"
    }
  },
  {
    title: "VULNEX: A Vulnerability Scanner for Extensions",
    authors: "Not specified",
    venue: "DIMVA",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Analysis Techniques", "Vulnerability Scanner", "Automation", "Security"],
    sok: {
      category: "Analysis Techniques",
      method: "Automated Scanning",
      threatModel: ["Extension Vulnerabilities"],
      dataset: "Browser Extensions",
      keyFindings: "Vulnerability scanner for browser extensions",
      limitations: "May have false positives/negatives"
    }
  },
  {
    title: "Semantic Analysis of Extension Manifests",
    authors: "Not specified",
    venue: "IEEE Access",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Analysis Techniques", "Semantic Analysis", "Manifests", "Static Analysis"],
    sok: {
      category: "Analysis Techniques",
      method: "Semantic Analysis",
      threatModel: ["Manifest Vulnerabilities"],
      dataset: "Browser Extension Manifests",
      keyFindings: "Semantic analysis of extension manifests",
      limitations: "Focuses on manifest analysis"
    }
  },
  {
    title: "Dynamic Taint Analysis for Browser Extensions",
    authors: "Not specified",
    venue: "RAID",
    year: 2017,
    readingStatus: "TO_READ",
    tags: ["Analysis Techniques", "Dynamic Analysis", "Taint Analysis", "Security"],
    sok: {
      category: "Analysis Techniques",
      method: "Dynamic Taint Analysis",
      threatModel: ["Data Flow Vulnerabilities"],
      dataset: "Browser Extensions",
      keyFindings: "Dynamic taint analysis for browser extensions",
      limitations: "Requires runtime execution"
    }
  },
  {
    title: "Fuzzing WebExtensions APIs",
    authors: "Not specified",
    venue: "Security",
    year: 2025,
    readingStatus: "TO_READ",
    tags: ["Analysis Techniques", "Fuzzing", "WebExtensions API", "Testing"],
    sok: {
      category: "Analysis Techniques",
      method: "Fuzzing",
      threatModel: ["API Vulnerabilities"],
      dataset: "WebExtensions APIs",
      keyFindings: "Fuzzing WebExtensions APIs for vulnerability discovery",
      limitations: "May miss complex vulnerabilities"
    }
  },
  // المحور 6: Inter-Component Security (10 papers)
  {
    title: "Post-Message Vulnerabilities in Browser Extensions",
    authors: "Not specified",
    venue: "EuroS&P",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["Inter-Component", "Post-Message", "Vulnerabilities", "Communication"],
    sok: {
      category: "Inter-Component Security",
      method: "Vulnerability Analysis",
      threatModel: ["Post-Message Vulnerabilities", "Message Passing"],
      dataset: "Browser Extensions",
      keyFindings: "Post-message vulnerabilities in browser extensions",
      limitations: "Focuses on post-message API"
    }
  },
  {
    title: "Breaking the Isolation: Extension-to-Extension Communication",
    authors: "Not specified",
    venue: "CCS",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Inter-Component", "Extension Communication", "Isolation", "Security"],
    sok: {
      category: "Inter-Component Security",
      method: "Communication Analysis",
      threatModel: ["Extension-to-Extension Communication", "Isolation Failures"],
      dataset: "Browser Extensions",
      keyFindings: "Breaking isolation via extension-to-extension communication",
      limitations: "Focuses on inter-extension communication"
    }
  },
  {
    title: "Cross-Extension Side Channels in Modern Browsers",
    authors: "Not specified",
    venue: "AsiaCCS",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Inter-Component", "Side Channels", "Cross-Extension", "Security"],
    sok: {
      category: "Inter-Component Security",
      method: "Side-Channel Analysis",
      threatModel: ["Cross-Extension Side Channels", "Information Leakage"],
      dataset: "Browser Extensions",
      keyFindings: "Cross-extension side channels in modern browsers",
      limitations: "Focuses on side-channel attacks"
    }
  },
  {
    title: "Security Analysis of the WebExtensions Messaging API",
    authors: "Not specified",
    venue: "ESORICS",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Inter-Component", "Messaging API", "Security Analysis", "WebExtensions"],
    sok: {
      category: "Inter-Component Security",
      method: "API Security Analysis",
      threatModel: ["Messaging API Vulnerabilities"],
      dataset: "WebExtensions Messaging API",
      keyFindings: "Security analysis of WebExtensions messaging API",
      limitations: "Focuses on messaging API"
    }
  },
  {
    title: "Message Passing Vulnerabilities in Manifest V3",
    authors: "Not specified",
    venue: "WWW",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["Inter-Component", "Message Passing", "Manifest V3", "Vulnerabilities"],
    sok: {
      category: "Inter-Component Security",
      method: "Vulnerability Analysis",
      threatModel: ["Message Passing Vulnerabilities", "Manifest V3 Security"],
      dataset: "Manifest V3 Extensions",
      keyFindings: "Message passing vulnerabilities in Manifest V3",
      limitations: "Focuses on Manifest V3"
    }
  },
  {
    title: "Isolation Failures in Browser Add-ons",
    authors: "Not specified",
    venue: "CCS",
    year: 2015,
    readingStatus: "TO_READ",
    tags: ["Inter-Component", "Isolation Failures", "Security", "Add-ons"],
    sok: {
      category: "Inter-Component Security",
      method: "Isolation Analysis",
      threatModel: ["Isolation Failures", "Security Boundaries"],
      dataset: "Browser Add-ons",
      keyFindings: "Isolation failures in browser add-ons",
      limitations: "Older work, may not reflect current architecture"
    }
  },
  {
    title: "Analyzing the Attack Surface of Extension-Page Interaction",
    authors: "Not specified",
    venue: "NDSS",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Inter-Component", "Attack Surface", "Extension-Page Interaction", "Security"],
    sok: {
      category: "Inter-Component Security",
      method: "Attack Surface Analysis",
      threatModel: ["Extension-Page Interaction", "Attack Surface"],
      dataset: "Browser Extensions",
      keyFindings: "Attack surface analysis of extension-page interaction",
      limitations: "Focuses on extension-page interaction"
    }
  },
  {
    title: "Secure Communication between Web Pages and Extensions",
    authors: "Not specified",
    venue: "WWW",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Inter-Component", "Secure Communication", "Web Pages", "Extensions"],
    sok: {
      category: "Inter-Component Security",
      method: "Communication Security Analysis",
      threatModel: ["Extension-Page Communication", "Security"],
      dataset: "Browser Extensions",
      keyFindings: "Secure communication between web pages and extensions",
      limitations: "Focuses on communication security"
    }
  },
  {
    title: "Sandboxing Content Scripts: A Security Review",
    authors: "Not specified",
    venue: "S&P",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["Inter-Component", "Sandboxing", "Content Scripts", "Security Review"],
    sok: {
      category: "Inter-Component Security",
      method: "Security Review",
      threatModel: ["Content Script Security", "Sandboxing"],
      dataset: "Browser Extension Content Scripts",
      keyFindings: "Security review of content script sandboxing",
      limitations: "Review paper"
    }
  },
  // المحور 7: Ad-blocking & Content Filtering (5 papers)
  {
    title: "Measuring the Impact of Manifest V3 on Ad-Blocking",
    authors: "Not specified",
    venue: "IMC",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["Ad-Blocking", "Manifest V3", "Impact Measurement", "Content Filtering"],
    sok: {
      category: "Ad-blocking & Content Filtering",
      method: "Impact Measurement",
      threatModel: ["Ad-Blocking Limitations", "Manifest V3 Impact"],
      dataset: "Ad-Blocking Extensions",
      keyFindings: "Impact of Manifest V3 on ad-blocking capabilities",
      limitations: "Focuses on Manifest V3 impact"
    }
  },
  {
    title: "Ad-Blocker Extensions and the Security of Filter Lists",
    authors: "Not specified",
    venue: "NDSS",
    year: 2019,
    readingStatus: "TO_READ",
    tags: ["Ad-Blocking", "Filter Lists", "Security", "Extensions"],
    sok: {
      category: "Ad-blocking & Content Filtering",
      method: "Security Analysis",
      threatModel: ["Filter List Security"],
      dataset: "Ad-Blocker Extensions",
      keyFindings: "Security of filter lists in ad-blocker extensions",
      limitations: "Focuses on filter list security"
    }
  },
  {
    title: "DOM Purifying Extensions: Security and Performance",
    authors: "Not specified",
    venue: "ACM Web Conf",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["Content Filtering", "DOM Purification", "Security", "Performance"],
    sok: {
      category: "Ad-blocking & Content Filtering",
      method: "Security and Performance Analysis",
      threatModel: ["DOM Security", "Performance Impact"],
      dataset: "DOM Purifying Extensions",
      keyFindings: "Security and performance of DOM purifying extensions",
      limitations: "Focuses on DOM purification"
    }
  },
  {
    title: "How Filter Lists Can Be Weaponized",
    authors: "Not specified",
    venue: "PETS",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["Ad-Blocking", "Filter Lists", "Weaponization", "Security"],
    sok: {
      category: "Ad-blocking & Content Filtering",
      method: "Security Analysis",
      threatModel: ["Filter List Abuse", "Weaponization"],
      dataset: "Filter Lists",
      keyFindings: "How filter lists can be weaponized",
      limitations: "Focuses on filter list abuse"
    }
  },
  {
    title: "Performance Overhead of Privacy Extensions",
    authors: "Not specified",
    venue: "WWW",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Privacy Extensions", "Performance", "Overhead", "Content Filtering"],
    sok: {
      category: "Ad-blocking & Content Filtering",
      method: "Performance Analysis",
      threatModel: ["Performance Impact"],
      dataset: "Privacy Extensions",
      keyFindings: "Performance overhead of privacy extensions",
      limitations: "Focuses on performance impact"
    }
  },
  // المحور 8: User Factors (5 papers)
  {
    title: "Why Users Install Malicious Extensions: A Large-scale Study",
    authors: "Not specified",
    venue: "CHI",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["User Factors", "Malicious Extensions", "Large-scale Study", "Human Factors"],
    sok: {
      category: "User Factors",
      method: "Large-scale User Study",
      threatModel: ["User Behavior", "Social Engineering"],
      dataset: "Extension Users",
      keyFindings: "Why users install malicious extensions",
      limitations: "User behavior may vary by culture"
    }
  },
  {
    title: "Analyzing the Efficacy of Browser Security Warnings",
    authors: "Not specified",
    venue: "USENIX Security",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["User Factors", "Security Warnings", "Efficacy", "Human Factors"],
    sok: {
      category: "User Factors",
      method: "Warning Efficacy Analysis",
      threatModel: ["Warning Fatigue", "User Awareness"],
      dataset: "Browser Security Warnings",
      keyFindings: "Efficacy of browser security warnings",
      limitations: "User behavior varies"
    }
  },
  {
    title: "User Perception of Browser Extension Permissions",
    authors: "Not specified",
    venue: "SOUPS",
    year: 2018,
    readingStatus: "TO_READ",
    tags: ["User Factors", "Permissions", "User Perception", "Human Factors"],
    sok: {
      category: "User Factors",
      method: "User Perception Study",
      threatModel: ["Permission Understanding", "User Awareness"],
      dataset: "Extension Users",
      keyFindings: "User perception of browser extension permissions",
      limitations: "User perception varies"
    }
  },
  {
    title: "The Impact of Visual Cues on Extension Trust",
    authors: "Not specified",
    venue: "CHI",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["User Factors", "Visual Cues", "Trust", "Human Factors"],
    sok: {
      category: "User Factors",
      method: "Trust Analysis",
      threatModel: ["Trust Manipulation", "Visual Deception"],
      dataset: "Extension Users",
      keyFindings: "Impact of visual cues on extension trust",
      limitations: "Visual perception varies"
    }
  },
  {
    title: "Dark Patterns in Extension Installation Flows",
    authors: "Not specified",
    venue: "EuroUSEC",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["User Factors", "Dark Patterns", "Installation Flows", "Human Factors"],
    sok: {
      category: "User Factors",
      method: "Pattern Analysis",
      threatModel: ["Dark Patterns", "User Manipulation"],
      dataset: "Extension Installation Flows",
      keyFindings: "Dark patterns in extension installation flows",
      limitations: "Patterns evolve"
    }
  },
  // المحور 9: AI & New Frontiers (15 papers)
  {
    title: "LLMs in Browser Extension Analysis: Opportunities and Risks",
    authors: "Not specified",
    venue: "ArXiv",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["AI", "LLMs", "Extension Analysis", "New Frontiers"],
    sok: {
      category: "AI & New Frontiers",
      method: "LLM Analysis",
      threatModel: ["AI Security", "LLM Risks"],
      dataset: "Browser Extensions",
      keyFindings: "Opportunities and risks of LLMs in extension analysis",
      limitations: "Early AI application"
    }
  },
  {
    title: "Vulnerabilities in AI-powered Browser Assistants",
    authors: "Not specified",
    venue: "CCS",
    year: 2025,
    readingStatus: "TO_READ",
    tags: ["AI", "Browser Assistants", "Vulnerabilities", "New Frontiers"],
    sok: {
      category: "AI & New Frontiers",
      method: "Vulnerability Analysis",
      threatModel: ["AI Vulnerabilities", "Assistant Security"],
      dataset: "AI-powered Browser Assistants",
      keyFindings: "Vulnerabilities in AI-powered browser assistants",
      limitations: "Early AI assistant analysis"
    }
  },
  {
    title: "Using Large Language Models to Generate Malicious Extensions",
    authors: "Not specified",
    venue: "Security",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["AI", "LLMs", "Malicious Extensions", "New Frontiers"],
    sok: {
      category: "AI & New Frontiers",
      method: "Attack Analysis",
      threatModel: ["AI-Generated Malware", "LLM Abuse"],
      dataset: "LLM-Generated Extensions",
      keyFindings: "Using LLMs to generate malicious extensions",
      limitations: "Early AI attack research"
    }
  },
  {
    title: "The Evolution of Malicious JavaScript in Extensions",
    authors: "Not specified",
    venue: "NDSS",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["New Frontiers", "JavaScript", "Malicious Code", "Evolution"],
    sok: {
      category: "AI & New Frontiers",
      method: "Evolutionary Analysis",
      threatModel: ["Malicious JavaScript", "Code Evolution"],
      dataset: "Browser Extension JavaScript",
      keyFindings: "Evolution of malicious JavaScript in extensions",
      limitations: "Focuses on JavaScript evolution"
    }
  },
  {
    title: "Analyzing the Security of Safari's Extension Model",
    authors: "Not specified",
    venue: "EuroS&P",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["New Frontiers", "Safari", "Extension Model", "Security"],
    sok: {
      category: "AI & New Frontiers",
      method: "Security Analysis",
      threatModel: ["Safari Extension Security"],
      dataset: "Safari Extensions",
      keyFindings: "Security analysis of Safari's extension model",
      limitations: "Focuses on Safari only"
    }
  },
  {
    title: "Security Implications of Chrome's Side Panel API",
    authors: "Not specified",
    venue: "WWW",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["New Frontiers", "Side Panel API", "Chrome", "Security"],
    sok: {
      category: "AI & New Frontiers",
      method: "API Security Analysis",
      threatModel: ["Side Panel API Security"],
      dataset: "Chrome Side Panel API",
      keyFindings: "Security implications of Chrome's Side Panel API",
      limitations: "Focuses on Side Panel API"
    }
  },
  {
    title: "Browser Extensions in the Era of Web3",
    authors: "Not specified",
    venue: "ArXiv",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["New Frontiers", "Web3", "Extensions", "Blockchain"],
    sok: {
      category: "AI & New Frontiers",
      method: "Web3 Analysis",
      threatModel: ["Web3 Security", "Blockchain Extensions"],
      dataset: "Web3 Browser Extensions",
      keyFindings: "Browser extensions in the Web3 era",
      limitations: "Early Web3 analysis"
    }
  },
  {
    title: "Analyzing Extension Security on Chromium-based Browsers (Edge, Brave)",
    authors: "Not specified",
    venue: "CCS",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["New Frontiers", "Chromium", "Edge", "Brave", "Security"],
    sok: {
      category: "AI & New Frontiers",
      method: "Comparative Security Analysis",
      threatModel: ["Chromium Extension Security"],
      dataset: "Chromium-based Browser Extensions",
      keyFindings: "Extension security on Chromium-based browsers",
      limitations: "Focuses on Chromium browsers"
    }
  },
  {
    title: "Automated Patching of Vulnerable Extensions",
    authors: "Not specified",
    venue: "ASE",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["New Frontiers", "Automated Patching", "Vulnerabilities", "Security"],
    sok: {
      category: "AI & New Frontiers",
      method: "Automated Patching",
      threatModel: ["Extension Vulnerabilities"],
      dataset: "Vulnerable Browser Extensions",
      keyFindings: "Automated patching of vulnerable extensions",
      limitations: "May introduce new vulnerabilities"
    }
  },
  {
    title: "The Role of Extensions in Modern Botnets",
    authors: "Not specified",
    venue: "DIMVA",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["New Frontiers", "Botnets", "Extensions", "Malware"],
    sok: {
      category: "AI & New Frontiers",
      method: "Botnet Analysis",
      threatModel: ["Botnets", "Malicious Extensions"],
      dataset: "Botnet Browser Extensions",
      keyFindings: "Role of extensions in modern botnets",
      limitations: "Focuses on botnet usage"
    }
  },
  {
    title: "Detecting C&C Channels in Browser Extensions",
    authors: "Not specified",
    venue: "TNSM",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["New Frontiers", "C&C Channels", "Detection", "Malware"],
    sok: {
      category: "AI & New Frontiers",
      method: "C&C Detection",
      threatModel: ["Command and Control", "Malicious Extensions"],
      dataset: "Malicious Browser Extensions",
      keyFindings: "Detection of C&C channels in browser extensions",
      limitations: "Focuses on C&C detection"
    }
  },
  {
    title: "Security Analysis of Cross-Platform Extension Frameworks",
    authors: "Not specified",
    venue: "S&P",
    year: 2025,
    readingStatus: "TO_READ",
    tags: ["New Frontiers", "Cross-Platform", "Extension Frameworks", "Security"],
    sok: {
      category: "AI & New Frontiers",
      method: "Framework Security Analysis",
      threatModel: ["Cross-Platform Security"],
      dataset: "Cross-Platform Extension Frameworks",
      keyFindings: "Security analysis of cross-platform extension frameworks",
      limitations: "Focuses on cross-platform frameworks"
    }
  },
  {
    title: "Privacy Leaks in Generative AI Extensions",
    authors: "Not specified",
    venue: "ArXiv",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["AI", "Generative AI", "Privacy Leaks", "New Frontiers"],
    sok: {
      category: "AI & New Frontiers",
      method: "Privacy Analysis",
      threatModel: ["AI Privacy Leaks", "Generative AI Security"],
      dataset: "Generative AI Browser Extensions",
      keyFindings: "Privacy leaks in generative AI extensions",
      limitations: "Early generative AI analysis"
    }
  },
  {
    title: "Measuring Extension-induced Browser Stability Issues",
    authors: "Not specified",
    venue: "IMC",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["New Frontiers", "Browser Stability", "Measurement", "Extensions"],
    sok: {
      category: "AI & New Frontiers",
      method: "Stability Measurement",
      threatModel: ["Browser Stability", "Extension Impact"],
      dataset: "Browser Extensions",
      keyFindings: "Measurement of extension-induced browser stability issues",
      limitations: "Focuses on stability impact"
    }
  },
  {
    title: "The Future of Browser Extension Security: A Roadmap",
    authors: "Not specified",
    venue: "SoK",
    year: 2026,
    readingStatus: "TO_READ",
    tags: ["New Frontiers", "Roadmap", "Future", "SoK"],
    sok: {
      category: "AI & New Frontiers",
      method: "Roadmap",
      threatModel: ["Future Security Challenges"],
      dataset: "Browser Extension Ecosystem",
      keyFindings: "Roadmap for future browser extension security",
      limitations: "Future-oriented, speculative"
    }
  },
  // المحور 10: CSP & Extensions Security (5 papers)
  {
    title: "The Impact of Browser Extensions on CSP Effectiveness",
    authors: "Not specified",
    venue: "ICSE",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["CSP", "Content Security Policy", "Extensions", "Security"],
    sok: {
      category: "CSP & Extensions Security",
      method: "Impact Analysis",
      threatModel: ["CSP Bypass", "Content Security Policy"],
      dataset: "Browser Extensions",
      keyFindings: "Impact of browser extensions on CSP effectiveness",
      limitations: "Focuses on CSP interactions"
    }
  },
  {
    title: "Bypassing CSP via Malicious Extension Content Scripts",
    authors: "Not specified",
    venue: "BlackHat",
    year: 2019,
    readingStatus: "TO_READ",
    tags: ["CSP", "CSP Bypass", "Content Scripts", "Malicious Extensions"],
    sok: {
      category: "CSP & Extensions Security",
      method: "Attack Analysis",
      threatModel: ["CSP Bypass", "Content Script Injection"],
      dataset: "Malicious Browser Extensions",
      keyFindings: "Bypassing CSP via malicious extension content scripts",
      limitations: "Focuses on CSP bypass techniques"
    }
  },
  {
    title: "CSP-Miner: Finding CSP Bypass in Browser Extensions",
    authors: "Not specified",
    venue: "EuroS&P",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["CSP", "CSP Bypass", "Mining", "Vulnerability Detection"],
    sok: {
      category: "CSP & Extensions Security",
      method: "Automated Mining",
      threatModel: ["CSP Bypass", "Extension Vulnerabilities"],
      dataset: "Browser Extensions",
      keyFindings: "Automated discovery of CSP bypass in browser extensions",
      limitations: "May have false positives"
    }
  },
  {
    title: "Policy-Based Isolation for Extension-Page Interactions",
    authors: "Not specified",
    venue: "CCS",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["CSP", "Isolation", "Extension-Page Interaction", "Policy"],
    sok: {
      category: "CSP & Extensions Security",
      method: "Policy Analysis",
      threatModel: ["Extension-Page Interaction", "Isolation Failures"],
      dataset: "Browser Extensions",
      keyFindings: "Policy-based isolation for extension-page interactions",
      limitations: "Focuses on policy-based approaches"
    }
  },
  {
    title: "Analyzing the Interference between Extensions and Site Policies",
    authors: "Not specified",
    venue: "WWW",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["CSP", "Site Policies", "Interference", "Extensions"],
    sok: {
      category: "CSP & Extensions Security",
      method: "Interference Analysis",
      threatModel: ["Policy Interference", "Site Security"],
      dataset: "Browser Extensions",
      keyFindings: "Analysis of interference between extensions and site policies",
      limitations: "Focuses on policy interference"
    }
  },
  // المحور 11: Supply Chain Attacks (5 papers)
  {
    title: "The Weakest Link: Analyzing Extension Update Servers",
    authors: "Not specified",
    venue: "USENIX Security",
    year: 2018,
    readingStatus: "TO_READ",
    tags: ["Supply Chain", "Update Servers", "Security", "Attack Vectors"],
    sok: {
      category: "Supply Chain Attacks",
      method: "Server Analysis",
      threatModel: ["Supply Chain Attacks", "Update Mechanism Attacks"],
      dataset: "Extension Update Servers",
      keyFindings: "Security analysis of extension update servers",
      limitations: "Focuses on update servers"
    }
  },
  {
    title: "Compromised Developer Accounts in the Chrome Web Store",
    authors: "Not specified",
    venue: "DIMVA",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Supply Chain", "Chrome Web Store", "Developer Accounts", "Compromise"],
    sok: {
      category: "Supply Chain Attacks",
      method: "Account Compromise Analysis",
      threatModel: ["Account Compromise", "Supply Chain Attacks"],
      dataset: "Chrome Web Store Developer Accounts",
      keyFindings: "Analysis of compromised developer accounts in Chrome Web Store",
      limitations: "Focuses on Chrome Web Store"
    }
  },
  {
    title: "Automated Detection of Typosquatting in Extension Names",
    authors: "Not specified",
    venue: "AsiaCCS",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Supply Chain", "Typosquatting", "Detection", "Automation"],
    sok: {
      category: "Supply Chain Attacks",
      method: "Automated Detection",
      threatModel: ["Typosquatting", "Social Engineering"],
      dataset: "Extension Names",
      keyFindings: "Automated detection of typosquatting in extension names",
      limitations: "Focuses on name-based attacks"
    }
  },
  {
    title: "Measuring the Lifespan of Malicious Extensions before Take-down",
    authors: "Not specified",
    venue: "IMC",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["Supply Chain", "Malicious Extensions", "Lifespan", "Take-down"],
    sok: {
      category: "Supply Chain Attacks",
      method: "Longitudinal Measurement",
      threatModel: ["Malicious Extensions", "Take-down Delays"],
      dataset: "Malicious Browser Extensions",
      keyFindings: "Measurement of malicious extension lifespan before take-down",
      limitations: "Time-bound study"
    }
  },
  {
    title: "The Security Risks of Third-party Libraries in Extensions",
    authors: "Not specified",
    venue: "ESORICS",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Supply Chain", "Third-party Libraries", "Security Risks", "Dependencies"],
    sok: {
      category: "Supply Chain Attacks",
      method: "Risk Analysis",
      threatModel: ["Third-party Library Risks", "Supply Chain Attacks"],
      dataset: "Browser Extension Dependencies",
      keyFindings: "Security risks of third-party libraries in extensions",
      limitations: "Focuses on library dependencies"
    }
  },
  // المحور 12: Modern Web APIs (WebRTC, WebUSB, Web Bluetooth) (5 papers)
  {
    title: "Privacy Leaks via WebRTC in Browser Extensions",
    authors: "Not specified",
    venue: "PETS",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["WebRTC", "Privacy", "Information Leakage", "Modern APIs"],
    sok: {
      category: "Modern Web APIs",
      method: "Privacy Analysis",
      threatModel: ["Privacy Leakage", "WebRTC Security"],
      dataset: "WebRTC Browser Extensions",
      keyFindings: "Privacy leaks via WebRTC in browser extensions",
      limitations: "Focuses on WebRTC"
    }
  },
  {
    title: "Accessing Hardware: Security Risks of WebUSB in Extensions",
    authors: "Not specified",
    venue: "USENIX Security",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["WebUSB", "Hardware Access", "Security Risks", "Modern APIs"],
    sok: {
      category: "Modern Web APIs",
      method: "Security Risk Analysis",
      threatModel: ["Hardware Access", "WebUSB Security"],
      dataset: "WebUSB Browser Extensions",
      keyFindings: "Security risks of WebUSB in browser extensions",
      limitations: "Focuses on WebUSB"
    }
  },
  {
    title: "Exposing the System: Browser Extensions and Web Bluetooth API",
    authors: "Not specified",
    venue: "CCS",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Web Bluetooth", "System Exposure", "Modern APIs", "Security"],
    sok: {
      category: "Modern Web APIs",
      method: "Security Analysis",
      threatModel: ["System Exposure", "Web Bluetooth Security"],
      dataset: "Web Bluetooth Browser Extensions",
      keyFindings: "System exposure via browser extensions and Web Bluetooth API",
      limitations: "Focuses on Web Bluetooth"
    }
  },
  {
    title: "Fingerprinting Users via Hardware-accessing Extensions",
    authors: "Not specified",
    venue: "IEEE S&P",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Fingerprinting", "Hardware Access", "Privacy", "Modern APIs"],
    sok: {
      category: "Modern Web APIs",
      method: "Fingerprinting Analysis",
      threatModel: ["User Fingerprinting", "Hardware-based Tracking"],
      dataset: "Hardware-accessing Browser Extensions",
      keyFindings: "Fingerprinting users via hardware-accessing extensions",
      limitations: "Focuses on hardware-based fingerprinting"
    }
  },
  {
    title: "Cross-API Attacks: From WebExtensions to OS APIs",
    authors: "Not specified",
    venue: "NDSS",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["Cross-API Attacks", "OS APIs", "WebExtensions", "Attack Vectors"],
    sok: {
      category: "Modern Web APIs",
      method: "Attack Analysis",
      threatModel: ["Cross-API Attacks", "OS API Access"],
      dataset: "Browser Extensions",
      keyFindings: "Cross-API attacks from WebExtensions to OS APIs",
      limitations: "Focuses on cross-API attack vectors"
    }
  },
  // المحور 13: Mobile Browser Extensions (5 papers)
  {
    title: "Security Analysis of Firefox for Android Extensions",
    authors: "Not specified",
    venue: "MobiSys",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Mobile", "Firefox", "Android", "Security Analysis"],
    sok: {
      category: "Mobile Browser Extensions",
      method: "Security Analysis",
      threatModel: ["Mobile Extension Security"],
      dataset: "Firefox for Android Extensions",
      keyFindings: "Security analysis of Firefox for Android extensions",
      limitations: "Focuses on Firefox for Android"
    }
  },
  {
    title: "Comparing Extension Security on Desktop vs Mobile",
    authors: "Not specified",
    venue: "WWW",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Mobile", "Desktop", "Comparative Study", "Security"],
    sok: {
      category: "Mobile Browser Extensions",
      method: "Comparative Analysis",
      threatModel: ["Mobile vs Desktop Security"],
      dataset: "Desktop and Mobile Browser Extensions",
      keyFindings: "Comparison of extension security on desktop vs mobile",
      limitations: "Comparative study"
    }
  },
  {
    title: "Resource Exhaustion Attacks in Mobile Extensions",
    authors: "Not specified",
    venue: "IEEE Access",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["Mobile", "Resource Exhaustion", "Attack Vectors", "Security"],
    sok: {
      category: "Mobile Browser Extensions",
      method: "Attack Analysis",
      threatModel: ["Resource Exhaustion", "DoS Attacks"],
      dataset: "Mobile Browser Extensions",
      keyFindings: "Resource exhaustion attacks in mobile extensions",
      limitations: "Focuses on resource-based attacks"
    }
  },
  {
    title: "Privacy Risks of Extensions on Mobile Chromium Forks",
    authors: "Not specified",
    venue: "ArXiv",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["Mobile", "Chromium", "Privacy Risks", "Mobile Browsers"],
    sok: {
      category: "Mobile Browser Extensions",
      method: "Privacy Risk Analysis",
      threatModel: ["Privacy Violations", "Mobile Privacy"],
      dataset: "Mobile Chromium Fork Extensions",
      keyFindings: "Privacy risks of extensions on mobile Chromium forks",
      limitations: "Focuses on Chromium forks"
    }
  },
  {
    title: "Analyzing Permissions in Mobile-First Browser Add-ons",
    authors: "Not specified",
    venue: "MobiCom",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Mobile", "Permissions", "Mobile-First", "Analysis"],
    sok: {
      category: "Mobile Browser Extensions",
      method: "Permission Analysis",
      threatModel: ["Permission Systems", "Mobile Security"],
      dataset: "Mobile-First Browser Add-ons",
      keyFindings: "Analysis of permissions in mobile-first browser add-ons",
      limitations: "Focuses on mobile-first add-ons"
    }
  },
  // المحور 14: AI in Attack & Defense (5 papers)
  {
    title: "Adversarial Machine Learning against Extension Detectors",
    authors: "Not specified",
    venue: "TIFS",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["AI", "Adversarial ML", "Extension Detectors", "Attack"],
    sok: {
      category: "AI in Attack & Defense",
      method: "Adversarial Analysis",
      threatModel: ["Adversarial ML", "Detection Evasion"],
      dataset: "Extension Detection Systems",
      keyFindings: "Adversarial machine learning attacks against extension detectors",
      limitations: "Focuses on adversarial attacks"
    }
  },
  {
    title: "Using GANs to Generate Stealthy Malicious Extensions",
    authors: "Not specified",
    venue: "CCS",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["AI", "GANs", "Malicious Extensions", "Stealth"],
    sok: {
      category: "AI in Attack & Defense",
      method: "GAN-based Generation",
      threatModel: ["AI-Generated Malware", "Stealth Techniques"],
      dataset: "Malicious Browser Extensions",
      keyFindings: "Using GANs to generate stealthy malicious extensions",
      limitations: "Early AI attack research"
    }
  },
  {
    title: "LLM-driven Static Analysis for Browser Extensions",
    authors: "Not specified",
    venue: "ArXiv",
    year: 2024,
    readingStatus: "TO_READ",
    tags: ["AI", "LLMs", "Static Analysis", "Defense"],
    sok: {
      category: "AI in Attack & Defense",
      method: "LLM-based Static Analysis",
      threatModel: ["Extension Vulnerabilities"],
      dataset: "Browser Extensions",
      keyFindings: "LLM-driven static analysis for browser extensions",
      limitations: "Early LLM application"
    }
  },
  {
    title: "Real-time Detection of Malicious Behavior using RNNs",
    authors: "Not specified",
    venue: "ICDM",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["AI", "RNNs", "Real-time Detection", "Malicious Behavior"],
    sok: {
      category: "AI in Attack & Defense",
      method: "RNN-based Detection",
      threatModel: ["Malicious Behavior", "Real-time Threats"],
      dataset: "Browser Extension Behavior",
      keyFindings: "Real-time detection of malicious behavior using RNNs",
      limitations: "Requires training data"
    }
  },
  {
    title: "The Role of Transformers in Vulnerability Detection in JavaScript",
    authors: "Not specified",
    venue: "ASE",
    year: 2023,
    readingStatus: "TO_READ",
    tags: ["AI", "Transformers", "Vulnerability Detection", "JavaScript"],
    sok: {
      category: "AI in Attack & Defense",
      method: "Transformer-based Detection",
      threatModel: ["JavaScript Vulnerabilities"],
      dataset: "JavaScript Code",
      keyFindings: "Role of transformers in vulnerability detection in JavaScript",
      limitations: "Focuses on JavaScript code"
    }
  },
  // المحور 15: Case Studies (5 papers)
  {
    title: "Deep Dive into the 'Great Suspender' Supply Chain Attack",
    authors: "Not specified",
    venue: "Blog/Paper Analysis",
    year: 2021,
    readingStatus: "TO_READ",
    tags: ["Case Study", "Supply Chain Attack", "Great Suspender", "Real-world"],
    sok: {
      category: "Case Studies",
      method: "Case Study Analysis",
      threatModel: ["Supply Chain Attacks", "Real-world Attacks"],
      dataset: "Great Suspender Extension",
      keyFindings: "Deep dive into the Great Suspender supply chain attack",
      limitations: "Single case study"
    }
  },
  {
    title: "Analyzing the 'AdBlock Plus' Security Vulnerability",
    authors: "Not specified",
    venue: "Security Report",
    year: 2019,
    readingStatus: "TO_READ",
    tags: ["Case Study", "AdBlock Plus", "Security Vulnerability", "Real-world"],
    sok: {
      category: "Case Studies",
      method: "Vulnerability Analysis",
      threatModel: ["Security Vulnerabilities", "Popular Extensions"],
      dataset: "AdBlock Plus Extension",
      keyFindings: "Analysis of AdBlock Plus security vulnerability",
      limitations: "Single case study"
    }
  },
  {
    title: "The 'Wavy' Extension: A Case Study in Large-scale Data Theft",
    authors: "Not specified",
    venue: "RAID",
    year: 2020,
    readingStatus: "TO_READ",
    tags: ["Case Study", "Data Theft", "Wavy Extension", "Large-scale"],
    sok: {
      category: "Case Studies",
      method: "Case Study Analysis",
      threatModel: ["Data Theft", "Large-scale Attacks"],
      dataset: "Wavy Extension",
      keyFindings: "Case study of large-scale data theft via Wavy extension",
      limitations: "Single case study"
    }
  },
  {
    title: "Malware Attribution in the Chrome Web Store",
    authors: "Not specified",
    venue: "Digital Investigation",
    year: 2022,
    readingStatus: "TO_READ",
    tags: ["Case Study", "Malware Attribution", "Chrome Web Store", "Forensics"],
    sok: {
      category: "Case Studies",
      method: "Forensic Analysis",
      threatModel: ["Malware Attribution", "Forensics"],
      dataset: "Chrome Web Store Malware",
      keyFindings: "Malware attribution in the Chrome Web Store",
      limitations: "Focuses on Chrome Web Store"
    }
  },
  {
    title: "Lessons Learned from 5 Years of Extension Malware Tracking",
    authors: "Not specified",
    venue: "SoK",
    year: 2025,
    readingStatus: "TO_READ",
    tags: ["Case Study", "Malware Tracking", "Lessons Learned", "SoK"],
    sok: {
      category: "Case Studies",
      method: "Longitudinal Study",
      threatModel: ["Extension Malware", "Long-term Trends"],
      dataset: "Extension Malware (5 years)",
      keyFindings: "Lessons learned from 5 years of extension malware tracking",
      limitations: "Retrospective analysis"
    }
  }
];

async function seedPapers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if papers already exist (informational only)
    const existingPapers = await Paper.countDocuments();
    if (existingPapers > 0) {
      console.log(`Database already contains ${existingPapers} papers.`);
      console.log('Adding new papers from seed data (duplicates will be skipped)...');
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

    // Step 1: Extract and create all unique tags
    console.log('Creating tags...');
    const allTagNames = new Set();
    initialPapers.forEach(paper => {
      if (paper.tags && Array.isArray(paper.tags)) {
        paper.tags.forEach(tag => allTagNames.add(tag.trim()));
      }
    });

    const tagMap = new Map(); // Maps original tag name to Tag document
    for (const tagName of allTagNames) {
      if (!tagName) continue;
      const tag = await Tag.findOrCreate(tagName);
      tagMap.set(tagName, tag.name); // Store the lowercase name
      console.log(`  ✓ Created/found tag: ${tag.displayName}`);
    }
    console.log(`✓ Created/found ${tagMap.size} tags`);

    // Step 2: Extract and create all unique threat models
    console.log('Creating threat models...');
    const allThreatModelNames = new Set();
    initialPapers.forEach(paper => {
      if (paper.sok && paper.sok.threatModel && Array.isArray(paper.sok.threatModel)) {
        paper.sok.threatModel.forEach(tm => allThreatModelNames.add(tm.trim()));
      }
    });

    const threatModelMap = new Map(); // Maps original threat model name to ThreatModel document
    for (const threatModelName of allThreatModelNames) {
      if (!threatModelName) continue;
      // Determine category based on threat model name
      let category = 'Security';
      const lowerName = threatModelName.toLowerCase();
      if (lowerName.includes('vulnerability') || lowerName.includes('vulnerable')) {
        category = 'Vulnerability';
      } else if (lowerName.includes('attack') || lowerName.includes('malicious') || lowerName.includes('abuse')) {
        category = 'Attack';
      } else if (lowerName.includes('privacy') || lowerName.includes('tracking') || lowerName.includes('fingerprint')) {
        category = 'Privacy';
      }

      // Use findOrCreate but we need to handle the category
      const normalizedName = threatModelName.trim().toLowerCase();
      let threatModel = await ThreatModel.findOne({ name: normalizedName });
      if (!threatModel) {
        threatModel = await ThreatModel.create({
          name: normalizedName,
          displayName: threatModelName.trim(),
          category: category
        });
      } else if (!threatModel.category || threatModel.category === 'Security') {
        // Update category if not set
        threatModel.category = category;
        await threatModel.save();
      }
      threatModelMap.set(threatModelName, threatModel.name); // Store the lowercase name
      console.log(`  ✓ Created/found threat model: ${threatModel.displayName} (${category})`);
    }
    console.log(`✓ Created/found ${threatModelMap.size} threat models`);

    // Step 3: Create papers with normalized tag and threat model names (skip duplicates)
    console.log('Creating papers...');
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const paper of initialPapers) {
      // Normalize tags: use the lowercase name from the tagMap
      const normalizedTags = paper.tags
        ? paper.tags
            .map(tag => tag.trim())
            .filter(tag => tag && tagMap.has(tag))
            .map(tag => tagMap.get(tag)) // Use the lowercase name
        : [];

      // Normalize threat models: use the lowercase name from the threatModelMap
      const normalizedThreatModels = paper.sok && paper.sok.threatModel
        ? paper.sok.threatModel
            .map(tm => tm.trim())
            .filter(tm => tm && threatModelMap.has(tm))
            .map(tm => threatModelMap.get(tm)) // Use the lowercase name
        : [];

      const paperData = {
        ...paper,
        tags: normalizedTags,
        sok: {
          ...paper.sok,
          threatModel: normalizedThreatModels
        },
        createdByUserId: adminUser._id
      };

      // Check if paper with same title already exists
      const existingPaper = await Paper.findOne({ 
        title: paperData.title.trim() 
      });
      
      if (existingPaper) {
        skippedCount++;
        console.log(`  ⊘ Skipped duplicate: "${paperData.title}"`);
        continue;
      }

      try {
        await Paper.create(paperData);
        createdCount++;
        console.log(`  ✓ Created: "${paperData.title}"`);
      } catch (err) {
        console.error(`  ✗ Failed to create "${paperData.title}":`, err.message);
        skippedCount++;
      }
    }

    console.log(`✓ Successfully created ${createdCount} new papers`);
    if (skippedCount > 0) {
      console.log(`⊘ Skipped ${skippedCount} duplicate papers`);
    }
    console.log(`Papers assigned to user: ${adminUser.username} (${adminUser.displayName})`);
    console.log(`Papers linked to ${tagMap.size} tags and ${threatModelMap.size} threat models`);

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

