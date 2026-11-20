// Tailwind includes the utility styles for the studio. The repository does
// not install autoprefixer; referencing it made production builds fail.
// Add autoprefixer here only alongside a pinned, lockfile-tracked dependency.
module.exports = {
  plugins: {
    tailwindcss: {},
  },
};
