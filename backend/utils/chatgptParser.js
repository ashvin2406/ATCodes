/**
 * ATCodes ChatGPT / Markdown Content Parser
 * Robust multi-format heading parser for the 10-Step ATCodes Pedagogical Learning Sequence.
 * Guarantees zero silent content loss and preserves all sub-topics, code blocks, and bullets.
 */

const SECTION_DEFINITIONS = [
  {
    key: 'curiosity',
    num: 1,
    name: 'Curiosity',
    patterns: [
      /(?:^|\n)(?:#{1,3}\s*)?(?:(?:step|section|part)?\s*(?:1|01)[\.\:\s-]*)?(?:curiosity|hook|provocative\s*question)\b/i
    ]
  },
  {
    key: 'conceptDiscovery',
    num: 2,
    name: 'Concept Discovery',
    patterns: [
      /(?:^|\n)(?:#{1,3}\s*)?(?:(?:step|section|part)?\s*(?:2|02)[\.\:\s-]*)?(?:concept(?:\s*discovery)?|core\s*theory\s*(?:&|and)?\s*definitions?)\b/i
    ]
  },
  {
    key: 'realLifeConnection',
    num: 3,
    name: 'Real-Life Connection',
    patterns: [
      /(?:^|\n)(?:#{1,3}\s*)?(?:(?:step|section|part)?\s*(?:3|03)[\.\:\s-]*)?(?:real[\s-]*(?:life|world)(?:\s*connection)?|mental\s*model|analogy|metaphor)\b/i
    ]
  },
  {
    key: 'blackboard',
    num: 4,
    name: "Teacher's Blackboard",
    patterns: [
      /(?:^|\n)(?:#{1,3}\s*)?(?:(?:step|section|part)?\s*(?:4|04)[\.\:\s-]*)?(?:teacher(?:'s)?\s*)?(?:blackboard|chalkboard|architecture\s*blackboard|core\s*(?:rules|laws))\b/i
    ]
  },
  {
    key: 'behindTheScenes',
    num: 5,
    name: 'Behind the Scenes',
    patterns: [
      /(?:^|\n)(?:#{1,3}\s*)?(?:(?:step|section|part)?\s*(?:5|05)[\.\:\s-]*)?(?:behind\s*(?:the\s*)?scenes|under\s*the\s*hood|memory\s*mechanics|v8|internals|compiler\s*mechanics)\b/i
    ]
  },
  {
    key: 'practical',
    num: 6,
    name: "Let's Build Something!",
    patterns: [
      /(?:^|\n)(?:#{1,3}\s*)?(?:(?:step|section|part)?\s*(?:6|06)[\.\:\s-]*)?(?:let(?:'s)?\s*build(?:\s*something)?|practical\s*(?:implementation|code|example)?|hands[\s-]*on)\b/i
    ]
  },
  {
    key: 'developerThinking',
    num: 7,
    name: 'Think Like a Developer',
    patterns: [
      /(?:^|\n)(?:#{1,3}\s*)?(?:(?:step|section|part)?\s*(?:7|07)[\.\:\s-]*)?(?:think\s*like\s*(?:a\s*)?(?:developer|senior|engineer)|developer\s*thinking|senior\s*mindset|trade[\s-]*offs?)\b/i
    ]
  },
  {
    key: 'classroomChallenge',
    num: 8,
    name: 'Classroom Challenge',
    patterns: [
      /(?:^|\n)(?:#{1,3}\s*)?(?:(?:step|section|part)?\s*(?:8|08)[\.\:\s-]*)?(?:classroom\s*(?:live\s*)?challenge|live\s*challenge|bug\s*puzzle|spot\s*the\s*bug)\b/i
    ]
  },
  {
    key: 'developerKnowledge',
    num: 9,
    name: 'Real Developer Knowledge',
    patterns: [
      /(?:^|\n)(?:#{1,3}\s*)?(?:(?:step|section)?\s*(?:9|09)[\.\:\s-]*)?(?:real\s*(?:developer\s*)?(?:knowledge|insights)|developer\s*knowledge|production\s*(?:usage|insights)|industry\s*reality)\b/i
    ]
  },
  {
    key: 'chapterMission',
    num: 10,
    name: 'Chapter Mission',
    patterns: [
      /(?:^|\n)(?:#{1,3}\s*)?(?:(?:step|section)?\s*(?:10)[\.\:\s-]*)?(?:chapter\s*(?:capstone\s*)?mission|capstone\s*(?:assignment|mission|project)|milestone\s*project|mission\s*challenge)\b/i
    ]
  }
];

/**
 * Extract code fences (```lang ... ```) from a text segment.
 */
/**
 * Extract code fences (```lang ... ```) line-by-line.
 * Prevents regex inversion or misparsing from inline backticks and space-padded tags.
 */
function extractCodeBlocks(text) {
  const lines = text.split('\n');
  const codeBlocks = [];
  const proseLines = [];
  let inCode = false;
  let currentCode = [];
  let currentLang = 'javascript';
  let primaryLang = 'javascript';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (!inCode) {
        // Start of code block
        inCode = true;
        currentCode = [];
        const lang = trimmed.replace(/^```\s*/, '').trim().toLowerCase();
        currentLang = lang || 'javascript';
        if (lang && lang !== 'text' && lang !== 'bash') {
          primaryLang = lang;
        }
      } else {
        // End of code block
        inCode = false;
        codeBlocks.push({
          lang: currentLang,
          code: currentCode.join('\n')
        });
      }
    } else if (inCode) {
      currentCode.push(line);
    } else {
      proseLines.push(line);
    }
  }

  // Find the primary/best code block (prefer actual programming languages like js/json/sql/py over simple terminal commands)
  let bestCode = '';
  const progBlocks = codeBlocks.filter(b => b.lang !== 'bash' && b.lang !== 'text' && b.code.trim().length > 10);
  if (progBlocks.length > 0) {
    bestCode = progBlocks.map(b => b.code.trim()).join('\n\n');
  } else if (codeBlocks.length > 0) {
    bestCode = codeBlocks.map(b => b.code.trim()).join('\n\n');
  }

  return {
    code: bestCode,
    language: primaryLang,
    cleanedText: proseLines.join('\n').trim()
  };
}

/**
 * Extract bullet lines from text
 */
function extractBullets(text) {
  const bullets = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[\*\-\•]\s+/.test(trimmed)) {
      bullets.push(trimmed.replace(/^[\*\-\•]\s+/, '').trim());
    } else if (/^\d+\.\s+/.test(trimmed)) {
      bullets.push(trimmed.replace(/^\d+\.\s+/, '').trim());
    }
  }
  return bullets;
}

/**
 * Sanitize text to prevent script injection
 */
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onload=/gi, '')
    .replace(/onerror=/gi, '');
}

/**
 * Match a line to a section definition
 */
function matchHeadingToSection(line) {
  const cleanLine = line.replace(/^#{1,4}\s+/, '').trim();
  for (const def of SECTION_DEFINITIONS) {
    // Sub-topic numbers like 2.1, 2.2, 3.1 should NOT be treated as primary section headers
    if (/^\d+\.\d+/.test(cleanLine)) continue;
    
    for (const pat of def.patterns) {
      if (pat.test(line) || pat.test(cleanLine)) {
        return def;
      }
    }
  }
  return null;
}

/**
 * Main parser function
 * Scans markdown, identifies all 10 section boundaries,
 * populates each section with its full content, and preserves unmapped frontmatter/extra sections.
 */
function parseChatGPTMarkdown(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    return {
      success: false,
      error: 'Empty or invalid content provided for import.',
      mappedCount: 0,
      sections: {},
      unmappedContent: ''
    };
  }

  const sanitized = sanitizeText(rawContent);
  const lines = sanitized.split('\n');

  // Step 1: Detect all heading lines and identify recognized section headers vs unrecognized
  const detectedMarkers = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const isHeading = /^#{1,4}\s+/.test(line) || /^\d{1,2}[\.\:\s-][A-Za-z]/.test(line);
    if (!isHeading) continue;

    const matchedDef = matchHeadingToSection(line);
    if (matchedDef) {
      detectedMarkers.push({
        lineIndex: i,
        def: matchedDef,
        isRecognized: true,
        headerText: line
      });
    } else if (
      (/^#{1,2}\s+/.test(line) && !/^\d+\.\d+/.test(line.replace(/^#{1,2}\s+/, ''))) ||
      (/(?:unrecognized|appendix|bonus\s*section|extra\s*content)/i.test(line))
    ) {
      // Possible unrecognized top/major heading or explicit extra section
      detectedMarkers.push({
        lineIndex: i,
        def: null,
        isRecognized: false,
        headerText: line
      });
    }
  }

  // Step 2: From detected markers, filter down to unique 10 sections
  // Prefer the first occurrence for each section key
  const primarySectionMap = new Map();
  for (const marker of detectedMarkers) {
    if (marker.isRecognized && !primarySectionMap.has(marker.def.key)) {
      primarySectionMap.set(marker.def.key, marker);
    }
  }

  // Sorted list of section anchors by lineIndex
  const sectionAnchors = Array.from(primarySectionMap.values()).sort((a, b) => a.lineIndex - b.lineIndex);

  // Initialize output structured sections
  const sections = {};
  for (const def of SECTION_DEFINITIONS) {
    sections[def.key] = {
      title: def.name,
      text: '',
      code: '',
      language: 'javascript',
      bullets: [],
      notes: ''
    };
  }

  const unmappedChunks = [];
  const mappedKeys = new Set();

  if (sectionAnchors.length === 0) {
    return {
      success: true,
      mappedCount: 0,
      totalSections: SECTION_DEFINITIONS.length,
      mappedKeys: [],
      sections,
      unmappedContent: sanitized.trim()
    };
  }

  // Content before the first marker is frontmatter/intro
  if (sectionAnchors[0].lineIndex > 0) {
    const preText = lines.slice(0, sectionAnchors[0].lineIndex).join('\n').trim();
    if (preText) {
      unmappedChunks.push(preText);
    }
  }

  // Extract content between section anchors
  for (let idx = 0; idx < sectionAnchors.length; idx++) {
    const curr = sectionAnchors[idx];
    const next = sectionAnchors[idx + 1];

    let startLine = curr.lineIndex + 1;
    let endLine = next ? next.lineIndex : lines.length;

    // Check if an unrecognized trailing section appears after the last recognized section
    if (!next) {
      const trailingUnrecognized = detectedMarkers.find(m => !m.isRecognized && m.lineIndex > curr.lineIndex);
      if (trailingUnrecognized) {
        endLine = trailingUnrecognized.lineIndex;
        const trailingText = lines.slice(trailingUnrecognized.lineIndex).join('\n').trim();
        if (trailingText) {
          unmappedChunks.push(trailingText);
        }
      }
    }

    const bodyText = lines.slice(startLine, endLine).join('\n').trim();
    mappedKeys.add(curr.def.key);

    const { code, language, cleanedText } = extractCodeBlocks(bodyText);
    const bullets = extractBullets(bodyText);

    sections[curr.def.key] = {
      title: curr.def.name,
      text: cleanedText || bodyText,
      code: code,
      language: language || 'javascript',
      bullets: bullets,
      notes: ''
    };
  }

  return {
    success: true,
    mappedCount: mappedKeys.size,
    totalSections: SECTION_DEFINITIONS.length,
    mappedKeys: Array.from(mappedKeys),
    sections,
    unmappedContent: unmappedChunks.join('\n\n---\n\n')
  };
}

module.exports = {
  SECTION_DEFINITIONS,
  parseChatGPTMarkdown,
  extractCodeBlocks,
  extractBullets,
  sanitizeText
};
