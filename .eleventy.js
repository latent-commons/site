module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });

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
