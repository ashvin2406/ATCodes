/**
 * ATCodes ChatGPT / Markdown Content Parser
 * Robust multi-format heading parser for the 10-Step ATCodes Pedagogical Learning Sequence.
 * Guarantees zero silent content loss.
 */

const SECTION_DEFINITIONS = [
  {
    key: 'curiosity',
    num: 1,
    name: 'Curiosity',
    patterns: [
      /(?:^|\n)(?:#+\s*)?(?:(?:1|01)[\.\:\s-]*\s*)?curiosity\b[^\n]*/i
    ]
  },
  {
    key: 'conceptDiscovery',
    num: 2,
    name: 'Concept Discovery',
    patterns: [
      /(?:^|\n)(?:#+\s*)?(?:(?:2|02)[\.\:\s-]*\s*)?concept(?:\s*discovery)?\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:2|02)[\.\:\s-]*\s*)?(?:core\s*)?theory\s*(?:&|and)?\s*definitions?\b[^\n]*/i
    ]
  },
  {
    key: 'realLifeConnection',
    num: 3,
    name: 'Real-Life Connection',
    patterns: [
      /(?:^|\n)(?:#+\s*)?(?:(?:3|03)[\.\:\s-]*\s*)?real[\s-]*life(?:\s*connection)?\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:3|03)[\.\:\s-]*\s*)?(?:mental\s*model|analogy|metaphor)\b[^\n]*/i
    ]
  },
  {
    key: 'blackboard',
    num: 4,
    name: "Teacher's Blackboard",
    patterns: [
      /(?:^|\n)(?:#+\s*)?(?:(?:4|04)[\.\:\s-]*\s*)?teacher(?:'s)?\s*blackboard\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:4|04)[\.\:\s-]*\s*)?blackboard\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:4|04)[\.\:\s-]*\s*)?chalkboard\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:4|04)[\.\:\s-]*\s*)?core\s*(?:rules|laws)\s*(?:&|and)?\s*diagrams?\b[^\n]*/i
    ]
  },
  {
    key: 'behindTheScenes',
    num: 5,
    name: 'Behind the Scenes',
    patterns: [
      /(?:^|\n)(?:#+\s*)?(?:(?:5|05)[\.\:\s-]*\s*)?behind\s*(?:the\s*)?scenes\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:5|05)[\.\:\s-]*\s*)?under\s*the\s*hood\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:5|05)[\.\:\s-]*\s*)?(?:v8|memory|internals|compiler\s*mechanics)\b[^\n]*/i
    ]
  },
  {
    key: 'practical',
    num: 6,
    name: "Let's Build Something!",
    patterns: [
      /(?:^|\n)(?:#+\s*)?(?:(?:6|06)[\.\:\s-]*\s*)?let(?:'s)?\s*build(?:\s*something)?\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:6|06)[\.\:\s-]*\s*)?practical(?:\s*code|\s*implementation|\s*example)?\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:6|06)[\.\:\s-]*\s*)?hands[\s-]*on\s*(?:project|code|build)\b[^\n]*/i
    ]
  },
  {
    key: 'developerThinking',
    num: 7,
    name: 'Think Like a Developer',
    patterns: [
      /(?:^|\n)(?:#+\s*)?(?:(?:7|07)[\.\:\s-]*\s*)?think\s*like\s*a\s*developer\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:7|07)[\.\:\s-]*\s*)?developer\s*thinking\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:7|07)[\.\:\s-]*\s*)?(?:senior\s*mindset|trade[\s-]*offs?|caveats?)\b[^\n]*/i
    ]
  },
  {
    key: 'classroomChallenge',
    num: 8,
    name: 'Classroom Challenge',
    patterns: [
      /(?:^|\n)(?:#+\s*)?(?:(?:8|08)[\.\:\s-]*\s*)?classroom\s*challenge\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:8|08)[\.\:\s-]*\s*)?(?:live\s*challenge|bug\s*puzzle|spot\s*the\s*bug)\b[^\n]*/i
    ]
  },
  {
    key: 'developerKnowledge',
    num: 9,
    name: 'Real Developer Knowledge',
    patterns: [
      /(?:^|\n)(?:#+\s*)?(?:(?:9|09)[\.\:\s-]*\s*)?real\s*developer\s*knowledge\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:9|09)[\.\:\s-]*\s*)?developer\s*knowledge\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:9|09)[\.\:\s-]*\s*)?(?:industry\s*reality|framework\s*mechanics|production\s*usage)\b[^\n]*/i
    ]
  },
  {
    key: 'chapterMission',
    num: 10,
    name: 'Chapter Mission',
    patterns: [
      /(?:^|\n)(?:#+\s*)?(?:(?:10)[\.\:\s-]*\s*)?chapter\s*mission\b[^\n]*/i,
      /(?:^|\n)(?:#+\s*)?(?:(?:10)[\.\:\s-]*\s*)?(?:capstone\s*assignment|milestone\s*project|mission\s*challenge)\b[^\n]*/i
    ]
  }
];

/**
 * Extract code fences (```lang ... ```) from a text segment.
 */
function extractCodeBlocks(text) {
  const codeRegex = /```([a-zA-Z0-9_\-\+\#]*)\s*\n([\s\S]*?)```/g;
  let code = '';
  let language = 'javascript';
  let cleanedText = text;

  let match;
  while ((match = codeRegex.exec(text)) !== null) {
    if (!language || language === 'javascript') {
      language = (match[1] || 'javascript').toLowerCase().trim();
    }
    if (code) {
      code += '\n\n' + match[2].trim();
    } else {
      code = match[2].trim();
    }
  }

  // Remove code blocks from cleaned text
  cleanedText = cleanedText.replace(/```[a-zA-Z0-9_\-\+\#]*\s*\n[\s\S]*?```/g, '').trim();

  return { code, language, cleanedText };
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
 * Match a single heading line to an ATCodes section definition
 */
function matchSectionDefinition(headingLine) {
  for (const def of SECTION_DEFINITIONS) {
    for (const pattern of def.patterns) {
      if (pattern.test(headingLine)) {
        return def;
      }
    }
  }
  return null;
}

/**
 * Main parser function
 * Scans markdown, identifies all heading boundaries (mapped vs unmapped),
 * populates the 10 sections, and guarantees zero silent content loss.
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

  // Find all headings: matches lines starting with #, or numbered lines like "1. Curiosity"
  const headingRegex = /(?:^|\n)(#{1,6}\s+[^\n]+|(?:[0-9]{1,2}[\.\:\s-]+[A-Za-z][^\n]+))/g;
  const markers = [];
  let headingMatch;

  while ((headingMatch = headingRegex.exec(sanitized)) !== null) {
    const rawMatch = headingMatch[0];
    const startIndex = headingMatch.index + (rawMatch.startsWith('\n') ? 1 : 0);
    const headerText = headingMatch[1].trim();
    const matchedDef = matchSectionDefinition(headerText);

    markers.push({
      key: matchedDef ? matchedDef.key : 'unmapped',
      name: matchedDef ? matchedDef.name : headerText,
      num: matchedDef ? matchedDef.num : null,
      startIndex,
      headerLength: headerText.length,
      headerText
    });
  }

  // If no markers found at all, entire content is unmapped
  if (markers.length === 0) {
    return {
      success: true,
      mappedCount: 0,
      totalSections: SECTION_DEFINITIONS.length,
      mappedKeys: [],
      sections,
      unmappedContent: sanitized.trim()
    };
  }

  const unmappedChunks = [];

  // Content before the first marker
  if (markers[0].startIndex > 0) {
    const preText = sanitized.substring(0, markers[0].startIndex).trim();
    if (preText) {
      unmappedChunks.push(preText);
    }
  }

  const mappedKeys = new Set();

  // Process each marker slice
  for (let i = 0; i < markers.length; i++) {
    const curr = markers[i];
    const contentStart = curr.startIndex + curr.headerLength;
    const contentEnd = (i + 1 < markers.length) ? markers[i + 1].startIndex : sanitized.length;
    const body = sanitized.substring(contentStart, contentEnd).trim();

    if (curr.key !== 'unmapped' && !mappedKeys.has(curr.key)) {
      mappedKeys.add(curr.key);
      const { code, language, cleanedText } = extractCodeBlocks(body);
      const bullets = extractBullets(body);

      sections[curr.key] = {
        title: curr.name,
        text: cleanedText || body,
        code: code,
        language: language || 'javascript',
        bullets: bullets,
        notes: ''
      };
    } else {
      // Unmapped section or duplicate section: preserve header and body!
      const unmappedBlock = `${curr.headerText}\n${body}`.trim();
      if (unmappedBlock) {
        unmappedChunks.push(unmappedBlock);
      }
    }
  }

  const unmappedContent = unmappedChunks.join('\n\n---\n\n');

  return {
    success: true,
    mappedCount: mappedKeys.size,
    totalSections: SECTION_DEFINITIONS.length,
    mappedKeys: Array.from(mappedKeys),
    sections,
    unmappedContent
  };
}

module.exports = {
  SECTION_DEFINITIONS,
  parseChatGPTMarkdown,
  extractCodeBlocks,
  extractBullets,
  sanitizeText
};
