import { promisify } from "util";
import { exec } from "child_process";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

const ENCONVO_BIN_DIR = `${os.homedir()}/.config/enconvo/bin`;

const GITHUB_RELEASE_API =
  "https://api.github.com/repos/Lymphatus/caesium-clt/releases/latest";

export class BinaryManager {
  private static cachedPath: string | null = null;

  /**
   * Get the architecture identifier for GitHub release assets.
   */
  private static getArch(): string {
    return process.arch === "arm64" ? "aarch64" : "x86_64";
  }

  /**
   * Try to find caesiumclt in common locations.
   */
  private static findExisting(): string | null {
    const candidates = [
      path.join(ENCONVO_BIN_DIR, "caesiumclt"),
      "/opt/homebrew/bin/caesiumclt",
      "/usr/local/bin/caesiumclt",
    ];
    for (const p of candidates) {
      if (existsSync(p)) return p;
    }
    return null;
  }

  /**
   * Download and install caesiumclt from GitHub Releases.
   */
  private static async installFromRelease(): Promise<string> {
    mkdirSync(ENCONVO_BIN_DIR, { recursive: true });

    const arch = this.getArch();
    const destBinary = path.join(ENCONVO_BIN_DIR, "caesiumclt");

    // Get latest release info
    const { stdout: releaseJson } = await execAsync(
      `curl -fsSL "${GITHUB_RELEASE_API}"`,
      { timeout: 30_000 }
    );

    const release = JSON.parse(releaseJson);
    const assetName = (release.assets as { name: string; browser_download_url: string }[]).find(
      (a) =>
        a.name.includes(arch) && a.name.includes("apple-darwin") && a.name.endsWith(".tar.gz")
    );

    if (!assetName) {
      throw new Error(
        `No compatible caesiumclt release found for ${arch}-apple-darwin`
      );
    }

    const downloadUrl = assetName.browser_download_url;

    // Download and extract — archive contains a subdirectory, use --strip-components=1 to flatten
    await execAsync(
      `curl -fsSL "${downloadUrl}" | tar xz --strip-components=1 -C "${ENCONVO_BIN_DIR}"`,
      { timeout: 60_000 }
    );

    // Make executable
    if (existsSync(destBinary)) {
      await execAsync(`chmod +x "${destBinary}"`);
    }

    if (!existsSync(destBinary)) {
      throw new Error(
        `Failed to install caesiumclt. Binary not found after extraction at ${destBinary}`
      );
    }

    return destBinary;
  }

  /**
   * Ensure caesiumclt is available and return the binary path.
   *
   * Resolution order:
   * 1. Cached path from previous call
   * 2. Enconvo bin dir (~/.config/enconvo/bin/)
   * 3. Common paths (/opt/homebrew/bin/, /usr/local/bin/)
   * 4. System PATH (which)
   * 5. Auto-download from GitHub Releases
   */
  static async ensureBinary(
    _formula?: string,
    _binaryName?: string
  ): Promise<string> {
    if (this.cachedPath) return this.cachedPath;

    // Check known locations
    const found = this.findExisting();
    if (found) {
      this.cachedPath = found;
      return found;
    }

    // Check PATH
    try {
      const { stdout } = await execAsync("which caesiumclt", { timeout: 5_000 });
      const p = stdout.trim();
      if (p) {
        this.cachedPath = p;
        return p;
      }
    } catch {
      // not in PATH
    }

    // Download from GitHub Releases
    const installed = await this.installFromRelease();
    this.cachedPath = installed;
    return installed;
  }
}
