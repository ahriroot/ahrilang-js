Bun.build({
    entrypoints: [
        './src/lib.ts',
        './src/arch/node.ts',
        './src/arch/browser.ts',
    ],
    target: 'node',
    outdir: './dist',
    minify: true,
    splitting: true,
})
