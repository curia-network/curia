#!/usr/bin/env tsx
/**
 * Build Embed Script (Bundled Version)
 * 
 * This script uses esbuild to properly bundle the TypeScript embed entry point
 * into a self-contained JavaScript file, eliminating the dual implementation problem.
 */

import { config } from 'dotenv';
import { build } from 'esbuild';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

const isProduction = process.env.NODE_ENV === 'production';

async function buildEmbedWithEsbuild() {
  try {
    console.log('[Build] Building embed.js with esbuild...');
    
    // Get environment URLs (required for build)
    const hostUrl = process.env.NEXT_PUBLIC_HOST_SERVICE_URL;
    const forumUrl = process.env.NEXT_PUBLIC_CURIA_FORUM_URL;
    
    if (!hostUrl) {
      throw new Error('NEXT_PUBLIC_HOST_SERVICE_URL environment variable is required');
    }
    
    if (!forumUrl) {
      throw new Error('NEXT_PUBLIC_CURIA_FORUM_URL environment variable is required');
    }

    // Ensure public directory exists
    const publicDir = join(process.cwd(), 'public');
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }

    // Build with esbuild
    const result = await build({
      entryPoints: ['src/lib/embed/embed-entry.ts'],
      bundle: true,
      minify: isProduction,
      format: 'iife', // Immediately Invoked Function Expression for browser
      platform: 'browser',
      target: 'es2020',
      outfile: join(publicDir, 'embed.js'),
      define: {
        // Inject environment variables at build time
        'CURIA_HOST_URL': JSON.stringify(hostUrl),
        'CURIA_FORUM_URL': JSON.stringify(forumUrl),
      },
      banner: {
        js: `/* Curia Embed Script - Built with esbuild ${new Date().toISOString()} */`
      },
      sourcemap: !isProduction,
      logLevel: 'info'
    });

    // Read the generated file to get size
    const fs = await import('fs');
    const embedScript = fs.readFileSync(join(publicDir, 'embed.js'), 'utf8');
    const sizeKB = Math.round(embedScript.length / 1024);
    
    console.log(`✅ Built embed.js to public/embed.js (${sizeKB}KB)`);
    
    if (!isProduction) {
      console.log('💡 Test at: http://localhost:3001/embed.js');
    }

    return true;
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    throw error;
  }
}

// Execute build
buildEmbedWithEsbuild().catch(process.exit); 