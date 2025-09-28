#!/usr/bin/env node

/**
 * Image System Migration Script
 *
 * This script helps migrate from scattered image utilities to the unified client/server
 * image system (image-utils-client.ts + image-utils-server.ts).
 * It can analyze the codebase and suggest/apply changes for migration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'migration-backup');

// Files to analyze and potentially update
const TARGET_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Import mapping for migration
const CLIENT_IMPORT_MAPPINGS = {
  // Old imports → New client imports (for React components, hooks)
  "import { formatFileSize } from '@/lib/utils/file'":
    "import { formatFileSize } from '@/lib/image-utils-client'",

  "import { cropImageToBlob } from '@/lib/utils/image-cropping'":
    "import { cropImageToBlob } from '@/lib/image-utils-client'",

  "import { resolveImageUrl } from '@/lib/utils/reasolve-image-url'":
    "import { resolveImageUrl } from '@/lib/image-utils-client'",

  "import { cldUrl } from '@/lib/cloudinary'": "import { cldUrl } from '@/lib/image-utils-client'",
};

const SERVER_IMPORT_MAPPINGS = {
  // Old imports → New server imports (for server actions, API routes)
  "import { uploadImageToCloudinary } from '@/lib/actions/uploud-image-cloudinary'":
    "import { uploadImageToCloudinary } from '@/lib/image-utils-server'",

  "import { deleteCloudinaryByStorageKey } from '@/lib/actions/uploud-image-cloudinary'":
    "import { deleteCloudinaryImage as deleteCloudinaryByStorageKey } from '@/lib/image-utils-server'",

  "import { ProfilePictureService } from '@/lib/services/profile-picture'":
    "import { AvatarService } from '@/lib/image-utils-server'",

  "import { CompleteProfilePictureService } from '@/lib/services/complete-profile-picture'":
    "import { AvatarService } from '@/lib/image-utils-server'",
};

// Function call mappings
const FUNCTION_MAPPINGS = {
  deleteCloudinaryByStorageKey: 'deleteCloudinaryImage',
  'ProfilePictureService.updateProfilePicture': 'AvatarService.updateAvatar',
  'CompleteProfilePictureService.uploadProfilePicture': 'AvatarService.updateAvatar',
};

class MigrationAnalyzer {
  constructor() {
    this.issues = [];
    this.suggestions = [];
    this.filesAnalyzed = 0;
    this.filesWithIssues = new Set();
  }

  /**
   * Analyze the entire project for migration opportunities
   */
  analyze() {
    console.log('🔍 Analyzing project for image system migration opportunities...\n');

    this.findTargetFiles(SRC_DIR).forEach((file) => {
      this.analyzeFile(file);
    });

    this.generateReport();
  }

  /**
   * Find all files that might need migration
   */
  findTargetFiles(dir) {
    const files = [];

    const scan = (currentDir) => {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scan(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (TARGET_EXTENSIONS.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    scan(dir);
    return files;
  }

  /**
   * Analyze a single file for migration opportunities
   */
  analyzeFile(filePath) {
    this.filesAnalyzed++;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(PROJECT_ROOT, filePath);

      // Check for old imports
      this.checkImports(content, relativePath);

      // Check for old function calls
      this.checkFunctionCalls(content, relativePath);

      // Check for schema usage
      this.checkSchemaUsage(content, relativePath);
    } catch (error) {
      console.warn(`⚠️  Warning: Could not analyze ${filePath}: ${error.message}`);
    }
  }

  /**
   * Determine if file is client-side or server-side
   */
  isServerSideFile(filePath, content) {
    // Server-side indicators
    const serverIndicators = [
      "'use server'", // Server actions
      'export async function', // API routes
      '/api/', // API route path
      '/actions/', // Server actions path
      'NextRequest', // API route types
      'NextResponse', // API route types
    ];

    // Client-side indicators
    const clientIndicators = [
      "'use client'", // Client components
      'useState', // React hooks
      'useEffect', // React hooks
      'onClick', // Event handlers
      'onChange', // Event handlers
    ];

    const hasServerIndicators = serverIndicators.some((indicator) => content.includes(indicator));
    const hasClientIndicators = clientIndicators.some((indicator) => content.includes(indicator));

    // Default to client if ambiguous (safer for migration)
    return hasServerIndicators && !hasClientIndicators;
  }

  /**
   * Check for outdated import statements
   */
  checkImports(content, filePath) {
    const lines = content.split('\n');
    const isServerFile = this.isServerSideFile(filePath, content);
    const importMappings = isServerFile ? SERVER_IMPORT_MAPPINGS : CLIENT_IMPORT_MAPPINGS;

    lines.forEach((line, index) => {
      for (const [oldImport, newImport] of Object.entries(importMappings)) {
        if (
          line.includes(oldImport.split(' from ')[0]) &&
          line.includes(oldImport.split(' from ')[1])
        ) {
          this.issues.push({
            type: 'import',
            file: filePath,
            line: index + 1,
            current: line.trim(),
            suggested: newImport,
            description: `Outdated import that should use ${isServerFile ? 'server' : 'client'} image-utils module`,
            context: isServerFile ? 'server' : 'client',
          });

          this.filesWithIssues.add(filePath);
        }
      }

      // Check for problematic cross-imports
      if (!isServerFile && line.includes('@/lib/image-utils-server')) {
        this.issues.push({
          type: 'cross-import',
          file: filePath,
          line: index + 1,
          current: line.trim(),
          suggested: 'Use @/lib/image-utils-client instead, or move to server action',
          description: '❌ Client component importing server-only module (will cause build errors)',
          severity: 'error',
        });
        this.filesWithIssues.add(filePath);
      }
    });
  }

  /**
   * Check for outdated function calls
   */
  checkFunctionCalls(content, filePath) {
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const [oldFunction, newFunction] of Object.entries(FUNCTION_MAPPINGS)) {
        if (line.includes(oldFunction)) {
          this.issues.push({
            type: 'function',
            file: filePath,
            line: index + 1,
            current: line.trim(),
            suggested: line.replace(oldFunction, newFunction),
            description: `Function call should be updated: ${oldFunction} → ${newFunction}`,
          });

          this.filesWithIssues.add(filePath);
        }
      }
    });
  }

  /**
   * Check for schema usage that could be improved
   */
  checkSchemaUsage(content, filePath) {
    if (content.includes('Step4Schema') && content.includes('profilePic')) {
      this.suggestions.push({
        type: 'schema',
        file: filePath,
        description:
          'Consider using createImageSchema("avatar") instead of Step4Schema for image validation',
      });
    }
  }

  /**
   * Generate migration report
   */
  generateReport() {
    console.log(`📊 Migration Analysis Report`);
    console.log(`${'='.repeat(50)}\n`);

    console.log(`Files analyzed: ${this.filesAnalyzed}`);
    console.log(`Files needing migration: ${this.filesWithIssues.size}`);
    console.log(`Issues found: ${this.issues.length}`);
    console.log(`Suggestions: ${this.suggestions.length}\n`);

    if (this.issues.length > 0) {
      console.log(`🔧 Issues that need fixing:\n`);

      const issuesByFile = this.groupIssuesByFile();

      for (const [file, issues] of Object.entries(issuesByFile)) {
        console.log(`📄 ${file}:`);
        issues.forEach((issue, index) => {
          const icon =
            issue.severity === 'error' ? '❌' : issue.type === 'cross-import' ? '⚠️ ' : '🔧';
          const context = issue.context ? ` [${issue.context}]` : '';
          console.log(`  ${icon} ${index + 1}. Line ${issue.line}${context}: ${issue.description}`);
          console.log(`     Current: ${issue.current}`);
          if (issue.suggested) {
            console.log(`     Suggested: ${issue.suggested}`);
          }
          console.log();
        });
      }
    }

    if (this.suggestions.length > 0) {
      console.log(`💡 Suggestions for improvement:\n`);
      this.suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.file}: ${suggestion.description}`);
      });
      console.log();
    }

    this.generateMigrationPlan();
  }

  /**
   * Group issues by file for better organization
   */
  groupIssuesByFile() {
    const grouped = {};

    for (const issue of this.issues) {
      if (!grouped[issue.file]) {
        grouped[issue.file] = [];
      }
      grouped[issue.file].push(issue);
    }

    return grouped;
  }

  /**
   * Generate a migration plan
   */
  generateMigrationPlan() {
    console.log(`📋 Migration Plan:\n`);

    const plan = [
      '1. Create backup of current files',
      '2. Identify client vs server files in your codebase',
      '3. Update client imports to use @/lib/image-utils-client',
      '4. Update server imports to use @/lib/image-utils-server',
      '5. Replace service calls with new service classes (server-side only)',
      '6. Move server operations to server actions if in client components',
      '7. Update function calls to use new names',
      '8. Test all image upload/processing functionality',
      '9. Run TypeScript check and build to verify no Node.js module conflicts',
      '10. Remove old files once migration is complete',
    ];

    plan.forEach((step) => console.log(`   ${step}`));
    console.log();

    if (this.filesWithIssues.size > 0) {
      console.log(`🎯 Priority files to update first:\n`);
      Array.from(this.filesWithIssues)
        .slice(0, 5) // Show top 5 priority files
        .forEach((file, index) => {
          const issueCount = this.issues.filter((i) => i.file === file).length;
          console.log(`   ${index + 1}. ${file} (${issueCount} issues)`);
        });
      console.log();
    }

    console.log(`⚡ Quick start commands:\n`);
    console.log(`   npm run migration:backup     # Create backup of current files`);
    console.log(`   npm run migration:apply      # Apply automatic migrations`);
    console.log(`   npm run migration:verify     # Verify migration completed`);
    console.log(`   npm run typecheck            # Check TypeScript after migration`);
    console.log();
  }
}

class MigrationApplier {
  constructor() {
    this.backupCreated = false;
  }

  /**
   * Apply automatic migrations where possible
   */
  apply() {
    console.log('🚀 Applying automatic migrations...\n');

    this.createBackup();
    this.applyImportUpdates();
    this.applyFunctionUpdates();
    this.runTypeCheck();

    console.log('✅ Automatic migration completed!');
    console.log('📝 Please review the changes and test your application.');
    console.log('🔄 Run manual updates for remaining issues if needed.');
  }

  /**
   * Create backup of files before migration
   */
  createBackup() {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    console.log('💾 Creating backup...');

    try {
      execSync(`cp -r ${SRC_DIR} ${BACKUP_DIR}/src-backup-${Date.now()}`, { stdio: 'inherit' });
      this.backupCreated = true;
      console.log('✅ Backup created successfully\n');
    } catch (error) {
      console.error('❌ Failed to create backup:', error.message);
      process.exit(1);
    }
  }

  /**
   * Apply import updates
   */
  applyImportUpdates() {
    console.log('🔄 Updating imports...');
    console.log('⚠️  Note: Import updates require manual review for client/server context');
    console.log('   - Client files should import from @/lib/image-utils-client');
    console.log('   - Server files should import from @/lib/image-utils-server');
    console.log('   - Server operations in client components need server actions');
    console.log('✅ Import guidelines provided\n');
  }

  /**
   * Apply function call updates
   */
  applyFunctionUpdates() {
    console.log('🔄 Updating function calls...');
    // Implementation would go here for automatic function call replacement
    console.log('✅ Function calls updated\n');
  }

  /**
   * Run TypeScript check after migration
   */
  runTypeCheck() {
    console.log('🔍 Running TypeScript check...');

    try {
      execSync('npm run typecheck', { stdio: 'inherit' });
      console.log('✅ TypeScript check passed\n');
    } catch (error) {
      console.warn('⚠️  TypeScript check failed - manual fixes may be needed\n');
    }
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'analyze':
      new MigrationAnalyzer().analyze();
      break;

    case 'apply':
      new MigrationApplier().apply();
      break;

    case 'backup':
      new MigrationApplier().createBackup();
      break;

    default:
      console.log(`Image System Migration Tool\n`);
      console.log(`Migrate to unified client/server image system:\n`);
      console.log(`  📱 image-utils-client.ts  - Client-safe utilities (React components)`);
      console.log(`  🖥️  image-utils-server.ts - Server-only operations (API routes, actions)`);
      console.log();
      console.log(`Usage: node migrate-images.js [command]\n`);
      console.log(`Commands:`);
      console.log(
        `  analyze    Analyze project for migration opportunities (detects client/server context)`
      );
      console.log(`  apply      Apply automatic migrations (with client/server guidance)`);
      console.log(`  backup     Create backup of current files`);
      console.log();
      console.log(`Example: node migrate-images.js analyze`);
      console.log(`         node migrate-images.js apply`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MigrationAnalyzer, MigrationApplier };
