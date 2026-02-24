import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fileManager } from "@/lib/services/file-manager";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dirPath = req.nextUrl.searchParams.get("path") || "/var/www";
  const action = req.nextUrl.searchParams.get("action") || "list";

  try {
    switch (action) {
      case "list": {
        const entries = await fileManager.listDirectory(dirPath);
        const diskUsage = await fileManager.getDiskUsage(dirPath);
        return NextResponse.json({ entries, diskUsage });
      }
      case "read": {
        const content = await fileManager.readFile(dirPath);
        return NextResponse.json(content);
      }
      case "permissions": {
        const perms = await fileManager.getPermissions(dirPath);
        return NextResponse.json(perms);
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "write":
        await fileManager.writeFile(body.path, body.content);
        break;
      case "mkdir":
        await fileManager.createDirectory(body.path);
        break;
      case "delete":
        await fileManager.deleteItem(body.path);
        break;
      case "rename":
        await fileManager.renameItem(body.oldPath, body.newPath);
        break;
      case "copy":
        await fileManager.copyItem(body.srcPath, body.destPath);
        break;
      case "chmod":
        await fileManager.setPermissions(body.path, body.mode, body.recursive);
        break;
      case "chown":
        await fileManager.setOwner(body.path, body.owner, body.group, body.recursive);
        break;
      case "zip":
        const zipPath = await fileManager.createZip(body.items, body.output);
        return NextResponse.json({ path: zipPath });
      case "unzip":
        await fileManager.extractZip(body.zipPath, body.destPath);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
