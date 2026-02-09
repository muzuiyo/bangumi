import type { ItemFormData, MediaType, Status } from "@/interfaces/items";
import { createItem } from "@/lib/api/items";
import type { ItemsTableRow } from "./itemsTable";
import "./bottomBar.css";

type Props = {
  items: ItemsTableRow[];
  onAdd?: () => void;
};

const BottomBar = ({ items, onAdd }: Props) => {
  const importBangumiData = async (
    jsonData: unknown,
    overlay: HTMLDivElement,
  ) => {
    const mediaTypeMap: Record<number, MediaType> = {
      1: "novel",
      2: "anime",
      3: "music",
      4: "game",
      // 三次元统一当作 tv 处理
      6: "tv",
    };

    const statusMap: Record<number, Status> = {
      1: "want",
      2: "done",
      3: "doing",
      4: "on_hold",
      5: "dropped",
    };

    const mediaTypeValues: MediaType[] = [
      "game",
      "novel",
      "manga",
      "music",
      "tv",
      "movie",
      "anime",
    ];

    const statusValues: Status[] = [
      "want",
      "doing",
      "done",
      "on_hold",
      "dropped",
    ];

    const normalizeMediaType = (value: unknown): MediaType | null => {
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (mediaTypeValues.includes(normalized as MediaType)) {
          return normalized as MediaType;
        }
        const asNumber = Number(normalized);
        if (Number.isFinite(asNumber)) {
          return mediaTypeMap[asNumber] ?? null;
        }
      }
      if (typeof value === "number") {
        return mediaTypeMap[value] ?? null;
      }
      return null;
    };

    const normalizeStatus = (value: unknown): Status | null => {
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (statusValues.includes(normalized as Status)) {
          return normalized as Status;
        }
        const asNumber = Number(normalized);
        if (Number.isFinite(asNumber)) {
          return statusMap[asNumber] ?? null;
        }
      }
      if (typeof value === "number") {
        return statusMap[value] ?? null;
      }
      return null;
    };

    const normalizeItem = (raw: unknown): ItemFormData | null => {
      if (!raw || typeof raw !== "object") return null;

      const data = raw as Record<string, unknown>;
      const title = typeof data.title === "string" ? data.title.trim() : "";
      const mediaType = normalizeMediaType(data.mediaType ?? data.media_type);
      const status = normalizeStatus(data.status);

      if (!title || !mediaType || !status) return null;

      const externalIdValue = data.external_id ?? data.externalId;
      const external_id =
        typeof externalIdValue === "number" || typeof externalIdValue === "string"
          ? String(externalIdValue)
          : undefined;

      const ratingValue = data.rating;
      const rating =
        typeof ratingValue === "number" && Number.isFinite(ratingValue) && ratingValue > 0
          ? Math.max(1, Math.min(10, Math.round(ratingValue)))
          : undefined;

      const comment = typeof data.comment === "string" ? data.comment : undefined;

      const updatedAtValue = data.updated_at ?? data.updatedAt;
      const updated_at = typeof updatedAtValue === "string" ? updatedAtValue : undefined;

      return {
        external_id,
        title,
        media_type: mediaType,
        status,
        rating,
        comment,
        updated_at,
      };
    };

    const list = Array.isArray(jsonData) ? jsonData : [jsonData];
    const loadingText = overlay.querySelector(
      '[data-import-text="true"]',
    ) as HTMLDivElement | null;

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let index = 0; index < list.length; index += 1) {
      const normalized = normalizeItem(list[index]);
      if (!normalized) {
        skippedCount += 1;
        errors.push(`第 ${index + 1} 条数据格式不完整，已跳过`);
        continue;
      }

      if (loadingText) {
        loadingText.textContent = `导入中... (${index + 1}/${list.length})`;
      }

      try {
        await createItem(normalized);
        successCount += 1;
      } catch (error) {
        failedCount += 1;
        const message = error instanceof Error ? error.message : "未知错误";
        errors.push(`第 ${index + 1} 条导入失败：${message}`);
      }
    }

    if (loadingText) {
      loadingText.textContent =
        `导入完成，成功 ${successCount} 条，失败 ${failedCount} 条，跳过 ${skippedCount} 条`;
    }

    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);

    if (failedCount > 0 || skippedCount > 0) {
      const detail = errors.slice(0, 5).join("\n");
      const more = errors.length > 5 ? "\n..." : "";
      alert(
        `导入完成，成功 ${successCount} 条，失败 ${failedCount} 条，跳过 ${skippedCount} 条` +
          (detail ? `\n\n${detail}${more}` : ""),
      );
    } else {
      alert(`导入完成，共 ${successCount} 条`);
    }
    window.location.reload()
  };

  const handleAddItem = () => {
    onAdd?.();
  };

  const handleImport = () => {
    // 创建隐藏的文件选择输入框
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.style.display = "none";

    // 监听文件选择
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }

      // 读取文件内容
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const jsonData = JSON.parse(content);

          //   console.log('导入的数据:', jsonData)
          //   console.log('共', Array.isArray(jsonData) ? jsonData.length : 1, '条记录')

          // 创建遮罩层
          const overlay = document.createElement("div");
          overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9998;
            display: flex;
            justify-content: center;
            align-items: center;
          `;

          // 创建加载框
          const loadingDiv = document.createElement("div");
          loadingDiv.style.cssText = `
            background: var(--background);
            color: var(--foreground);
            border-radius: 4px;
            padding: 30px 50px;
            border: 1px solid var(--foreground);
            z-index: 9999;
            font-size: 16px;
            text-align: center;
            min-width: 200px;
          `;
          loadingDiv.textContent = "导入中，请稍候...";
          loadingDiv.setAttribute("data-import-text", "true");
          
          overlay.appendChild(loadingDiv);
          document.body.appendChild(overlay);

          try {
            // 执行导入
            await importBangumiData(jsonData, overlay);
          } catch (error) {
            // 移除遮罩层
            if (document.body.contains(overlay)) {
              document.body.removeChild(overlay);
            }
            console.error("导入失败:", error);
            alert(
              "导入失败：" +
                (error instanceof Error ? error.message : "未知错误"),
            );
          }
        } catch (error) {
          console.error("解析 JSON 失败:", error);
          alert("文件格式错误，请选择有效的 JSON 文件");
        }
      };

      reader.onerror = () => {
        console.error("读取文件失败");
        alert("读取文件失败，请重试");
      };

      reader.readAsText(file);
    };

    // 触发文件选择
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  const handleExport = () => {
    if (items.length === 0) {
      alert("没有数据可以导出");
      return;
    }

    // 准备 CSV 表头
    const headers = [
      "序号",
      "标题",
      "类型",
      "状态",
      "评分",
      "评论",
      "更新时间",
      "ID",
    ];

    // 准备 CSV 数据行
    const rows = items.map((item, index) => {
      return [
        index + 1,
        `"${item.title.replace(/"/g, '""')}"`, // 标题需要转义双引号
        item.mediaType,
        item.status,
        item.rating ?? "N/A",
        item.comment ? `"${item.comment.replace(/"/g, '""')}"` : "N/A", // 评论需要转义双引号
        item.updatedAt,
        item.id,
      ].join(",");
    });

    // 组合成 CSV 字符串
    const csvContent = [headers.join(","), ...rows].join("\n");

    // 生成文件名（包含当前日期）
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `bangumi-export-${timestamp}.csv`;

    // 使用 Blob 创建下载链接
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" }),
    );
    link.download = filename;

    try {
      link.click();
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 1000);
    } catch (error) {
      console.error("下载 CSV 文件失败:", error);
      alert("导出失败，请稍后重试");
    }
  };

  return (
    <div className="bottom-bar">
      <div className="bottom-bar-left">
        <button
          type="button"
          className="bottom-bar-button button-add"
          onClick={handleAddItem}
        >
          + 新增一行
        </button>
      </div>
      <div className="bottom-bar-right">
        <button
          type="button"
          className="bottom-bar-button button-import"
          onClick={handleImport}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="button-icon"
          >
            <path d="M12 3v12" />
            <path d="m8 11 4 4 4-4" />
            <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
          </svg>
          导入
        </button>
        <button
          type="button"
          className="bottom-bar-button button-export"
          onClick={handleExport}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="button-icon"
          >
            <path d="M3 5v14" />
            <path d="M21 12H7" />
            <path d="m15 18 6-6-6-6" />
          </svg>
          导出
        </button>
      </div>
    </div>
  );
};

export default BottomBar;
