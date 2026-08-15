import fs from "fs";
import path from "path";
import { translations } from "../src/translations.js";

interface StringMatch {
  text: string;
  file: string;
  line: number;
  type: "jsx-text" | "placeholder" | "title" | "aria-label" | "alt" | "toast-or-message";
}

// Technical keywords & identifiers to ignore
const TECHNICAL_IDENTIFIERS = new Set([
  "BUYER", "VENDOR", "ADMIN", "DRIVER", "INVESTOR",
  "PENDING", "APPROVED", "REJECTED", "SUSPENDED", "CANCELLED", "COMPLETED", "DELIVERED", "SHIPPED", "CONFIRMED", "PROCESSING",
  "XOF", "FCFA", "EUR", "USD", "PERCENTAGE", "FIXED", "MOBILE_MONEY", "ECOBANK", "FLOOS", "TMONEY", "CASH",
  "POST", "GET", "PUT", "DELETE", "PATCH",
  "ID", "UUID", "URL", "JSON", "JWT", "API", "KYC", "OTP", "2FA", "SMS", "SMTP", "SQL", "HTML", "CSS", "SVG", "PNG", "JPG",
  "DESC", "ASC", "ALL", "NONE", "TRUE", "FALSE", "NULL", "UNDEFINED",
  "FR", "EN", "EWE", "KABYE"
]);

// Helper to determine if a string looks like Tailwind CSS / class names
function isCssClassString(str: string): boolean {
  const cssTokens = [
    "flex", "grid", "hidden", "block", "inline", "relative", "absolute", "fixed", "sticky",
    "w-", "h-", "min-w-", "max-w-", "min-h-", "max-h-",
    "p-", "px-", "py-", "pt-", "pb-", "pl-", "pr-",
    "m-", "mx-", "my-", "mt-", "mb-", "ml-", "mr-",
    "text-", "bg-", "border-", "rounded-", "shadow-", "gap-", "space-x-", "space-y-",
    "items-", "justify-", "col-span-", "font-", "leading-", "tracking-",
    "hover:", "focus:", "active:", "dark:", "sm:", "md:", "lg:", "xl:", "2xl:", "group-hover:"
  ];

  const words = str.trim().split(/\s+/);
  if (words.length >= 2) {
    const cssMatches = words.filter(w => cssTokens.some(tok => w.startsWith(tok) || w.includes(":") || w.includes("/")));
    if (cssMatches.length / words.length > 0.4) {
      return true;
    }
  }
  return false;
}

// Helper to determine if a string is user-facing natural language
function isUserFacingString(str: string): boolean {
  const trimmed = str.trim();

  // Too short, empty, or just numbers/symbols
  if (trimmed.length < 2) return false;
  if (/^[\d\s\.,:;\-_/\\|•★☆%€$#@+*?!=()[\]{}<>"'`~]+$/.test(trimmed)) return false;

  // URLs, paths, filenames, or code identifiers
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) return false;
  if (/\.(png|jpg|jpeg|svg|webp|gif|json|ts|tsx|js|jsx|css|ico)$/i.test(trimmed)) return false;
  if (/^[a-zA-Z0-9_\-]+@[a-zA-Z0-9_\-\.]+$/.test(trimmed)) return false; // Email
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return false; // Hex color
  if (/^[A-Z0-9_]{3,}$/.test(trimmed) && TECHNICAL_IDENTIFIERS.has(trimmed)) return false; // Technical enum
  if (/^[a-z]+[A-Z0-9][a-zA-Z0-9]*$/.test(trimmed)) return false; // camelCase variable name
  if (/^[a-z0-9\-]+$/.test(trimmed) && trimmed.includes("-") && !trimmed.includes(" ")) return false; // kebab-case identifier

  // CSS classes check
  if (isCssClassString(trimmed)) return false;

  // Must contain letters (including accented letters like é, è, à, etc.)
  if (!/[a-zA-ZÀ-ÿ]/.test(trimmed)) return false;

  return true;
}

// Recursively find all TSX/TS files in src/
function getSourceFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== "dist" && file !== ".git") {
        getSourceFiles(fullPath, fileList);
      }
    } else if (file.endsWith(".tsx") || (file.endsWith(".ts") && !file.endsWith(".d.ts"))) {
      // Exclude translation definitions themselves and test files
      if (!fullPath.includes("translations.ts") && !fullPath.includes("audit-translations.ts") && !fullPath.includes(".test.")) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

// Extract hardcoded strings from a source file
function extractStringsFromFile(filePath: string): StringMatch[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const matches: StringMatch[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmedLine = line.trim();

    // Skip comments, imports, exports of types
    if (trimmedLine.startsWith("//") || trimmedLine.startsWith("/*") || trimmedLine.startsWith("*")) return;
    if (trimmedLine.startsWith("import ") || trimmedLine.startsWith("export type ") || trimmedLine.startsWith("export interface ")) return;
    if (trimmedLine.includes("console.log(") || trimmedLine.includes("console.warn(") || trimmedLine.includes("console.error(")) return;
    if (trimmedLine.includes("logger.info(") || trimmedLine.includes("logger.warn(") || trimmedLine.includes("logger.error(")) return;

    // 1. Check UI attributes: placeholder="...", title="...", alt="...", aria-label="..."
    const attrRegex = /(placeholder|title|alt|aria-label)\s*=\s*["']([^"']+)["']/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(line)) !== null) {
      const attrType = attrMatch[1] as "placeholder" | "title" | "aria-label" | "alt";
      const text = attrMatch[2].trim();
      if (isUserFacingString(text)) {
        matches.push({
          text,
          file: path.relative(process.cwd(), filePath),
          line: lineNum,
          type: attrType,
        });
      }
    }

    // 2. Check JSX text between tags: >Some Text<
    const jsxTextRegex = />([^<>{}\n]+)</g;
    let jsxMatch;
    while ((jsxMatch = jsxTextRegex.exec(line)) !== null) {
      const text = jsxMatch[1].trim();
      if (isUserFacingString(text)) {
        matches.push({
          text,
          file: path.relative(process.cwd(), filePath),
          line: lineNum,
          type: "jsx-text",
        });
      }
    }

    // 3. Check user-facing messages in toast/alert/message properties
    const messageRegex = /(message|toast|alert|error|success|description)\s*:\s*["']([^"']{4,})["']/g;
    let msgMatch;
    while ((msgMatch = messageRegex.exec(line)) !== null) {
      const text = msgMatch[2].trim();
      if (isUserFacingString(text)) {
        matches.push({
          text,
          file: path.relative(process.cwd(), filePath),
          line: lineNum,
          type: "toast-or-message",
        });
      }
    }
  });

  return matches;
}

// Main Audit Execution Function
export function runTranslationAudit() {
  console.log("=================================================");
  console.log("            === TRANSLATION AUDIT ===");
  console.log("=================================================");

  const srcDir = path.join(process.cwd(), "src");
  if (!fs.existsSync(srcDir)) {
    console.error("Error: src directory not found.");
    process.exit(1);
  }

  const files = getSourceFiles(srcDir);
  console.log(`\nAnalyzing ${files.length} React / TypeScript components in src/...\n`);

  // Collect all existing translation keys and string values
  const existingKeys = new Set<string>();
  const existingValues = new Set<string>();

  Object.entries(translations).forEach(([_lang, transObj]) => {
    Object.entries(transObj as Record<string, string>).forEach(([key, val]) => {
      existingKeys.add(key);
      if (typeof val === "string") {
        existingValues.add(val.trim().toLowerCase());
      }
    });
  });

  // Extract all hardcoded strings
  const allMatches: StringMatch[] = [];
  files.forEach(f => {
    const extracted = extractStringsFromFile(f);
    allMatches.push(...extracted);
  });

  // Filter unique matches
  const uniqueMatchesMap = new Map<string, StringMatch[]>();
  allMatches.forEach(m => {
    const normalized = m.text.trim();
    if (!uniqueMatchesMap.has(normalized)) {
      uniqueMatchesMap.set(normalized, []);
    }
    uniqueMatchesMap.get(normalized)!.push(m);
  });

  // Identify strings that are not yet in translations
  const missingTranslations: { text: string; occurrences: StringMatch[] }[] = [];
  const coveredStrings: { text: string; occurrences: StringMatch[] }[] = [];

  uniqueMatchesMap.forEach((occurrences, text) => {
    const normalized = text.toLowerCase();
    if (existingValues.has(normalized)) {
      coveredStrings.push({ text, occurrences });
    } else {
      missingTranslations.push({ text, occurrences });
    }
  });

  // Output 1: Potential hardcoded strings
  console.log("Potential hardcoded strings detected in UI components:");
  console.log("--------------------------------------------------");
  const sampleHardcoded = Array.from(uniqueMatchesMap.keys()).slice(0, 15);
  sampleHardcoded.forEach(str => {
    const firstOcc = uniqueMatchesMap.get(str)![0];
    console.log(`  • "${str}" (${firstOcc.file}:${firstOcc.line}) [${firstOcc.type}]`);
  });
  if (uniqueMatchesMap.size > 15) {
    console.log(`  ... and ${uniqueMatchesMap.size - 15} more strings.`);
  }

  // Output 2: Existing translation keys
  console.log("\nExisting translation keys in src/translations.ts:");
  console.log("--------------------------------------------------");
  const keySample = Array.from(existingKeys).slice(0, 15);
  keySample.forEach(k => {
    console.log(`  - ${k}`);
  });
  if (existingKeys.size > 15) {
    console.log(`  ... (${existingKeys.size} total keys registered across languages)`);
  }

  // Output 3: Potential missing translations
  console.log("\nPotential missing translations (Candidate report):");
  console.log("--------------------------------------------------");
  if (missingTranslations.length === 0) {
    console.log("  ✅ All detected strings match existing translation values!");
  } else {
    missingTranslations.slice(0, 20).forEach(item => {
      const occ = item.occurrences[0];
      console.log(`  ⚠️  "${item.text}"`);
      console.log(`      Found in: ${occ.file}:${occ.line} (${item.occurrences.length} occurrence${item.occurrences.length > 1 ? "s" : ""})`);
    });
    if (missingTranslations.length > 20) {
      console.log(`  ... and ${missingTranslations.length - 20} additional candidates.`);
    }
  }

  // Summary Metrics
  console.log("\n=================================================");
  console.log("               AUDIT SUMMARY");
  console.log("=================================================");
  console.log(`  • Total Components Scanned  : ${files.length}`);
  console.log(`  • Existing Translation Keys : ${existingKeys.size}`);
  console.log(`  • Total UI Text Occurrences : ${allMatches.length}`);
  console.log(`  • Unique Hardcoded Strings  : ${uniqueMatchesMap.size}`);
  console.log(`  • Already in Translation DB : ${coveredStrings.length}`);
  console.log(`  • Potential Missing Keys    : ${missingTranslations.length}`);
  console.log("=================================================\n");
}

// Execute immediately when invoked directly via CLI
runTranslationAudit();
