"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import InfoBanner from "@/components/infoBanner";
import ItemsTable, { type ItemsTableRow } from "@/components/itemsTable";
import BottomBar from "@/components/bottomBar";
import NewCard from "@/components/newCard";
import { useAuth } from "@/contexts/authContext";
import { getItems } from "@/lib/api/items";
import { StatusMap, type Item } from "@/interfaces/items";

const mediaTypeLabel: Record<Item["media_type"], string> = {
  anime: "动画",
  movie: "电影",
  tv: "电视剧",
  novel: "小说",
  manga: "漫画",
  game: "游戏",
  music: "音乐",
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMediaType, setFilterMediaType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [titleInput, setTitleInput] = useState<string>("");
  const [filterTitle, setFilterTitle] = useState<string>("");
  const [sortByDate, setSortByDate] = useState<"asc" | "desc">("desc");
  const [sortByRating, setSortByRating] = useState<"asc" | "desc" | "none">("none");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getItems(undefined, { signal: controller.signal })
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  // 标题搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterTitle(titleInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [titleInput]);

  const counts = useMemo(() => {
    const wantNum = items.filter((item) => item.status === "want").length;
    const doingNum = items.filter((item) => item.status === "doing").length;
    const doneNum = items.filter((item) => item.status === "done").length;
    const onHoldNum = items.filter((item) => item.status === "on_hold").length;
    const droppedNum = items.filter((item) => item.status === "dropped").length;
    return { wantNum, doingNum, doneNum, onHoldNum, droppedNum };
  }, [items]);

  const formatStatus = useCallback((item: Item) => {
    const map = StatusMap[item.status];
    if (typeof map === "string") return map;
    return map[item.media_type];
  }, []);

  const formatUpdatedAt = useCallback((value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (filterMediaType !== "all") {
      result = result.filter((item) => item.media_type === filterMediaType);
    }

    if (filterStatus !== "all") {
      result = result.filter((item) => item.status === filterStatus);
    }

    if (filterTitle.trim()) {
      const search = filterTitle.toLowerCase();
      result = result.filter((item) =>
        item.title.toLowerCase().includes(search),
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.updated_at).getTime();
      const dateB = new Date(b.updated_at).getTime();
      return sortByDate === "desc" ? dateB - dateA : dateA - dateB;
    });
    if (sortByRating !== "none") {
      // 按评分排序
      result.sort((a, b) => {
        const ratingA = a.rating ?? -Infinity;
        const ratingB = b.rating ?? -Infinity;
        return sortByRating === "desc" ? ratingB - ratingA : ratingA - ratingB;
      });
    }

    return result;
  }, [
    items,
    filterMediaType,
    filterStatus,
    filterTitle,
    sortByDate,
    sortByRating,
  ]);

  const rows: ItemsTableRow[] = useMemo(
    () =>
      filteredItems.map((item) => ({
        id: item.id,
        title: item.title,
        mediaType: mediaTypeLabel[item.media_type],
        status: formatStatus(item),
        rating: item.rating ?? null,
        comment: item.comment ?? null,
        updatedAt: formatUpdatedAt(item.updated_at),
      })),
    [filteredItems, formatStatus, formatUpdatedAt],
  );

  return (
    <main>
      <div className="bread-bar">
        <InfoBanner
          wantNum={counts.wantNum}
          doingNum={counts.doingNum}
          doneNum={counts.doneNum}
          onHoldNum={counts.onHoldNum}
          droppedNum={counts.droppedNum}
        />
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>类型</label>
          <select
            value={filterMediaType}
            onChange={(e) => setFilterMediaType(e.target.value)}
          >
            <option value="all">全部</option>
            <option value="anime">动画</option>
            <option value="movie">电影</option>
            <option value="tv">剧集</option>
            <option value="novel">小说</option>
            <option value="manga">漫画</option>
            <option value="game">游戏</option>
            <option value="music">音乐</option>
          </select>
        </div>

        <div className="filter-group">
          <label>状态</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">全部</option>
            <option value="want">想看/玩/读/听</option>
            <option value="doing">在看/玩/读/听</option>
            <option value="done">看过/玩过/读过/听过</option>
            <option value="on_hold">搁置</option>
            <option value="dropped">抛弃</option>
          </select>
        </div>

        <div className="filter-group">
          <label>更新时间</label>
          <select
            value={sortByDate}
            onChange={(e) => setSortByDate(e.target.value as "asc" | "desc")}
          >
            <option value="desc">最新优先</option>
            <option value="asc">最早优先</option>
          </select>
        </div>

        <div className="filter-group">
          <label>评分</label>
          <select
            value={sortByRating}
            onChange={(e) =>
              setSortByRating(e.target.value as "asc" | "desc" | "none")
            }
          >
            <option value="none">不排序</option>
            <option value="desc">高分优先</option>
            <option value="asc">低分优先</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <label>标题</label>
          <input
            type="text"
            placeholder="搜索标题..."
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
          />
        </div>
      </div>

      <div className="excel-container">
        <ItemsTable isLoading={loading} isError={error} skeletonRows={5} items={rows} emptyText="暂无记录" />
      </div>

      {isAuthenticated && (
        <BottomBar items={rows} onAdd={() => setIsCreating(true)} />
      )}
      {isAuthenticated && isCreating && (
        <NewCard onClose={() => setIsCreating(false)} />
      )}
    </main>
  );
}
