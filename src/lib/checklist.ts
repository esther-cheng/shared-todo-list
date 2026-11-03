export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ParsedDescription {
  context: string;
  checklist: ChecklistItem[];
  hasChecklist: boolean;
}

/**
 * Parses a raw task description into separated context notes and checklist items.
 * Handles both legacy bullet format (`• item`) and structured checklist sections.
 */
export function parseTaskDescription(raw: string | null | undefined): ParsedDescription {
  if (!raw || !raw.trim()) {
    return {
      context: "",
      checklist: [],
      hasChecklist: false,
    };
  }

  const trimmed = raw.trim();

  // Pattern 1: Explicit "Checklist:" section header (with or without markdown header like "### Checklist")
  const checklistHeaderRegex = /(?:^|\n)(?:#{1,4}\s*)?Checklist:\s*(?:\n|$)/i;
  const match = trimmed.match(checklistHeaderRegex);

  if (match && match.index !== undefined) {
    const contextPart = trimmed.slice(0, match.index).trim();
    const checklistPart = trimmed.slice(match.index + match[0].length).trim();

    const items = parseChecklistLines(checklistPart);
    return {
      context: contextPart,
      checklist: items,
      hasChecklist: true,
    };
  }

  // Pattern 2: Legacy bullet or checkbox format mixed in lines
  const lines = trimmed.split("\n");
  const contextLines: string[] = [];
  const checklistItems: ChecklistItem[] = [];

  let foundBullet = false;

  for (const line of lines) {
    const itemMatch = line.match(/^\s*(?:[•*-]|\d+\.)\s*(?:\[([ xX])\])?\s*(.*)$/);
    if (itemMatch) {
      foundBullet = true;
      const isCompleted = itemMatch[1]?.toLowerCase() === "x";
      const itemText = itemMatch[2]?.trim();
      if (itemText) {
        checklistItems.push({
          id: `item-${checklistItems.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
          text: itemText,
          completed: isCompleted,
        });
      }
    } else if (!foundBullet) {
      contextLines.push(line);
    } else {
      // If there's text after bullets that isn't a bullet, treat as context or note
      if (line.trim()) {
        checklistItems.push({
          id: `item-${checklistItems.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
          text: line.trim(),
          completed: false,
        });
      }
    }
  }

  if (foundBullet && checklistItems.length > 0) {
    return {
      context: contextLines.join("\n").trim(),
      checklist: checklistItems,
      hasChecklist: true,
    };
  }

  // Pattern 3: Pure context/notes, no checklist
  return {
    context: trimmed,
    checklist: [],
    hasChecklist: false,
  };
}

function parseChecklistLines(content: string): ChecklistItem[] {
  const lines = content.split("\n");
  const items: ChecklistItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const checkboxMatch = line.match(/^(?:[•*-]|\d+\.)?\s*(?:\[([ xX])\])?\s*(.*)$/);
    if (checkboxMatch) {
      const isCompleted = checkboxMatch[1]?.toLowerCase() === "x";
      const text = (checkboxMatch[2] || "").trim();
      if (text) {
        items.push({
          id: `item-${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
          text,
          completed: isCompleted,
        });
        continue;
      }
    }

    items.push({
      id: `item-${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
      text: line,
      completed: false,
    });
  }

  return items;
}

/**
 * Serializes context notes and checklist items into a clean, backward-compatible string.
 */
export function serializeTaskDescription(
  context: string,
  checklist: ChecklistItem[],
  hasChecklist: boolean
): string {
  const cleanContext = (context || "").trim();
  const validItems = (checklist || []).filter((item) => item.text && item.text.trim());

  if (!hasChecklist) {
    return cleanContext;
  }

  const checklistLines = validItems.map((item) => {
    const prefix = item.completed ? "[x]" : "•";
    return `${prefix} ${item.text.trim()}`;
  });

  const checklistBlock = checklistLines.length > 0
    ? `Checklist:\n${checklistLines.join("\n")}`
    : `Checklist:`;

  if (cleanContext) {
    return `${cleanContext}\n\n${checklistBlock}`;
  }

  return checklistBlock;
}

