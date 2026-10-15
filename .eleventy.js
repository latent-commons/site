module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/.htaccess": ".htaccess" });

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
