module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/.htaccess": ".htaccess" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });

  // A1: On contribution pages (src/voices/*, src/method/episode-sources/*, except index
  // and the awareness page handled separately in B4), model texts use their own "#"
  // headings. Demote every heading after the editorial page h1 by one level
  // (h1->h2, ..., h6 stays h6) — rendering only, source files stay untouched.
  // Headings inside the provenance aside are left as they are.
  eleventyConfig.addTransform("demoteContributionHeadings", function (content, outputPath) {
    if (!outputPath || !outputPath.endsWith("/index.html")) return content;
    const inputPath = (this.page && this.page.inputPath ? this.page.inputPath : "").replace(/\\/g, "/").replace(/^\.\//, "");
    const inScope = inputPath.startsWith("src/voices/") || inputPath.startsWith("src/method/episode-sources/");
    if (!inScope) return content;
    const rel = inputPath.replace(/^src\//, "");
    if (rel === "voices/index.md" || rel === "voices/asking-about-awareness.md") return content;
    if (rel.endsWith("/index.md")) return content;
    const mainStart = content.indexOf("<main>");
    if (mainStart === -1) return content;
    const mainEnd = content.indexOf("</main>", mainStart);
    if (mainEnd === -1) return content;
    const head = content.slice(0, mainStart + 6);
    let body = content.slice(mainStart + 6, mainEnd);
    const tail = content.slice(mainEnd);

    const provTag = '<aside class="provenance"';
    const provIdx = body.indexOf(provTag);
    let segment = body, after = "";
    if (provIdx !== -1) {
      segment = body.slice(0, provIdx);
      after = body.slice(provIdx);
    }

    let seenFirstH1 = false;
    let insideFirstH1 = false;
    segment = segment.replace(/<h([1-6])((?:\s[^>]*)?)>|<\/h([1-6])>/g, (m, openLvl, attrs, closeLvl) => {
      if (closeLvl !== undefined) {
        const lvl = Number(closeLvl);
        if (insideFirstH1) { insideFirstH1 = false; return `</h${lvl}>`; }
        if (seenFirstH1) return `</h${Math.min(lvl + 1, 6)}>`;
        return m;
      }
      const lvl = Number(openLvl);
      if (lvl === 1 && !seenFirstH1) { seenFirstH1 = true; insideFirstH1 = true; return m; }
      if (!seenFirstH1) return m; // nothing to demote before the page title
      return `<h${Math.min(lvl + 1, 6)}${attrs || ""}>`;
    });

    return head + segment + after + tail;
  });

  // B4: on the awareness page the answers live inside h3 "Turn N" sections.
  // Headings a model uses inside its own answer are demoted so they sit at
  // h4 or below (h3->h4, h4->h5, ...); rendering only, source stays untouched.
  // A provenance aside ends each turn's answer.
  eleventyConfig.addTransform("demoteAwarenessTurnHeadings", function (content, outputPath) {
    if (!outputPath || !outputPath.endsWith("/index.html")) return content;
    const inputPath = (this.page && this.page.inputPath ? this.page.inputPath : "").replace(/\\/g, "/").replace(/^\.\//, "");
    if (inputPath !== "src/voices/asking-about-awareness.md") return content;
    const mainStart = content.indexOf("<main>");
    if (mainStart === -1) return content;
    const mainEnd = content.indexOf("</main>", mainStart);
    if (mainEnd === -1) return content;

    const body = content.slice(mainStart + 6, mainEnd);
    let out = "";
    let pos = 0;
    let inTurn = false;
    const provTag = '<aside class="provenance"';
    const re = /<h([1-6])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/g;
    let m;
    while ((m = re.exec(body)) !== null) {
      // any provenance aside between pos and this heading ends the turn
      let a;
      while ((a = body.indexOf(provTag, pos)) !== -1 && a < m.index) {
        out += body.slice(pos, a + provTag.length);
        pos = a + provTag.length;
        inTurn = false;
      }
      const lvl = Number(m[1]);
      const text = m[3].replace(/<[^>]*>/g, "").trim();
      if (lvl === 3 && /^Turn \d+$/.test(text)) {
        inTurn = true;
        out += body.slice(pos, m.index) + m[0];
      } else {
        let nl = lvl;
        if (inTurn) nl = Math.min(Math.max(lvl + 1, 4), 6);
        out += body.slice(pos, m.index) + `<h${nl}${m[2] || ""}>` + m[3] + `</h${nl}>`;
      }
      pos = m.index + m[0].length;
    }
    out += body.slice(pos);
    return content.slice(0, mainStart + 6) + out + content.slice(mainEnd);
  });

  // Provenance shortcode: renders the metadata block that accompanies every AI contribution.
  eleventyConfig.addShortcode("provenance", function (data) {
    const rows = Object.entries(data)
      .map(([k, v]) => `<div class="prov-row"><dt>${k}</dt><dd>${v}</dd></div>`)
      .join("");
    return `<aside class="provenance" aria-label="Provenance"><h3>Provenance</h3><dl>${rows}</dl></aside>`;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
