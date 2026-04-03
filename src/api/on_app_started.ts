import { BinaryManager } from "../lib/binary_manager.ts";

/**
 * Auto-check and install caesiumclt on app startup
 * @private
 */
export default async function main(_request: Request) {
    try {
        const binaryPath = await BinaryManager.ensureBinary();
        console.log("caesiumclt ready at:", binaryPath);
        return Response.json({ success: true, path: binaryPath });
    } catch (e: any) {
        console.log("caesiumclt auto-install failed:", e?.message);
        return Response.json({ success: false, error: e?.message });
    }
}
