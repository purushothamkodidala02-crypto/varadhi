type FormattedQuestionTextProps = {
  text: string;
  className?: string;
};

const labelledSection =
  /^(Assertion\s*\([A]\)|(?:వాదన|ప్రకటన|ప్రతిపాదన)\s*\([A]\)|Reason\s*\([R]\)|కారణం\s*\([R]\)|(?:Statement|Conclusion|List)\s+(?:I{1,4}|V|\d+)|(?:ప్రకటన|వాక్యం|తీర్మానం|జాబితా)\s+(?:I{1,4}|V|\d+|[౦-౯]+))\s*:\s*(.*)$/i;

const instructionStart =
  /^(?:(?:Choose|Select|Which|How\s+many\s+of|Pick)\b|(?:సరైన|సరికాని|కింది|క్రింది).*(?:ఎంచుకోండి|గుర్తించండి))/i;

const numberedSection =
  /^((?:(?:\d{1,2}|[౦-౯]{1,2})|I{1,3}|IV|V)[.)])\s+(.*)$/i;

const sectionHeading =
  /^(?:Statements?|Conclusions?|Directions?|Codes?|ప్రకటనలు?|తీర్మానాలు?|సూచనలు?)\s*:$/i;

const dataRow = /^(.{1,40}?)\s+—\s+([\d౦-౯].*)$/;

export function containsTeluguText(text: string) {
  return /[\u0c00-\u0c7f]/.test(text);
}

function questionLines(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(
      /((?:Statements?|ప్రకటనలు?)\s*:)[ \t]*(.*?)(?=[ \t]+(?:Conclusions?|తీర్మానాలు?)\s*:|$)/gim,
      (_match, heading: string, body: string) =>
        `${heading}\n${body.trim().replace(/\.\s+/g, ".\n")}`,
    )
    .replace(
      /[ \t]+(?=(?:Statements?|Conclusions?|Directions?|Codes?|ప్రకటనలు?|తీర్మానాలు?|సూచనలు?)\s*:)/gi,
      "\n",
    )
    .replace(
      /((?:Statements?|Conclusions?|Directions?|Codes?|ప్రకటనలు?|తీర్మానాలు?|సూచనలు?)\s*:)[ \t]*/gi,
      "$1\n",
    )
    .replace(
      /[ \t]+(?=(?:Assertion\s*\([A]\)|(?:వాదన|ప్రకటన|ప్రతిపాదన)\s*\([A]\)|Reason\s*\([R]\)|కారణం\s*\([R]\)|(?:Statement|Conclusion|List)\s+(?:I{1,4}|V|\d+)|(?:ప్రకటన|వాక్యం|తీర్మానం|జాబితా)\s+(?:I{1,4}|V|\d+|[౦-౯]+))\s*:)/gi,
      "\n",
    )
    .replace(
      /[ \t]+(?=(?:Choose|Select)\s+(?:the|a)\s+(?:correct|incorrect|most appropriate)\b)/gi,
      "\n",
    )
    .replace(
      /[ \t]+(?=(?:Which\s+(?:one\s+)?of\s+(?:the\s+)?(?:above|following)|How\s+many\s+of\s+(?:the\s+)?(?:above|following))\b)/gi,
      "\n",
    )
    .replace(
      /[ \t]+(?=(?:(?:సరైన|సరికాని)\s+(?:సమాధానాన్ని|జవాబును|జతను)|(?:కింది|క్రింది)\s+వాటిలో).*(?:ఎంచుకోండి|గుర్తించండి))/g,
      "\n",
    )
    .replace(/[ \t]+(?=(?:I{1,3}|IV|V)\.\s)/gi, "\n")
    .replace(
      /[ \t]+(?=Which\s+(?:conclusion|statement)s?\b)/gi,
      "\n",
    )
    .replace(
      /:\s+(?=(?:(?:District|జిల్లా)\s+[A-Z]|[A-Z])\s*[—–-]\s*[\d౦-౯])/g,
      ":\n",
    )
    .replace(
      /;\s*(?=(?:(?:District|జిల్లా)\s+[A-Z]|[A-Z])\s*[—–-]\s*[\d౦-౯])/g,
      "\n",
    )
    .replace(/[ \t]+(?=Which\s+[A-Za-z])/g, "\n")
    .replace(
      /([.?:])\s+(?=(?:\d{1,2}|[౦-౯]{1,2})[.)]\s)/g,
      "$1\n",
    )
    .replace(/;\s*(?=(?:\d{1,2}|[౦-౯]{1,2})[.)]\s)/g, "\n")
    .replace(/([^\s—–-])\s*[—–-]\s*(?=(?:[A-H]|ఎ|బి|సి|డి)\.\s)/g, "$1 — ")
    .replace(/([^\s—–-])\s*[—–-]\s*(?=[\d౦-౯])/g, "$1 — ")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function FormattedQuestionText({
  text,
  className = "",
}: FormattedQuestionTextProps) {
  const lines = questionLines(text);
  const isTelugu = containsTeluguText(text);

  return (
    <div
      lang={isTelugu ? "te" : undefined}
      className={`space-y-2.5 font-semibold ${isTelugu ? "font-telugu" : ""} ${className}`}
    >
      {lines.map((line, index) => {
        const labelled = line.match(labelledSection);
        const numbered = line.match(numberedSection);
        const data = line.match(dataRow);
        const isHeading = sectionHeading.test(line);
        const isInstruction = instructionStart.test(line);

        return (
          <p
            key={`${index}-${line}`}
            className={isInstruction ? "pt-1 text-slate-700" : undefined}
          >
            {isHeading ? (
              <span className="text-slate-950">{line}</span>
            ) : labelled ? (
              <>
                <span className="text-slate-950">{labelled[1]}:</span>{" "}
                {labelled[2]}
              </>
            ) : numbered ? (
              <>
                <span className="mr-1 text-slate-950">{numbered[1]}</span>{" "}
                {numbered[2]}
              </>
            ) : data ? (
              <>
                <span className="text-slate-950">{data[1]}</span>{" — "}
                {data[2]}
              </>
            ) : (
              line
            )}
          </p>
        );
      })}
    </div>
  );
}
