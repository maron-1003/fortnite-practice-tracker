import { useState, useEffect, useRef } from "react";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

dayjs.extend(isoWeek);

// 週番号
function getWeekNumber(date) {
  return dayjs(date).isoWeek();
}

// 週ごとの合計
function getWeeklyChartData(records) {
  const weekly = {};
  records.forEach((r) => {
    const week = getWeekNumber(r.date);
    if (!weekly[week]) weekly[week] = 0;
    weekly[week] += r.minutes;
  });
  return weekly;
}

// 日ごとの合計
function getDailyTotals(records) {
  const daily = {};
  records.forEach((r) => {
    if (!daily[r.date]) daily[r.date] = 0;
    daily[r.date] += r.minutes;
  });
  return daily;
}

export default function App() {
  const [practiceType, setPracticeType] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [records, setRecords] = useState([]);

  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );

  const timerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("fortnite_records");
    if (saved) setRecords(JSON.parse(saved));
  }, []);

  const handleStart = () => {
    if (!practiceType) {
      alert("練習内容を選択してください");
      return;
    }
    const now = new Date();
    setStartTime(now);
    setIsRunning(true);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  };

  const handlePause = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
  };

  const handleStop = () => {
    if (!startTime) return;

    clearInterval(timerRef.current);
    setIsRunning(false);

    const end = new Date();
    const minutes = Math.floor(elapsed / 60);

    const newRecord = {
      type: practiceType,
      start: startTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      end: end.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      minutes,
      date: selectedDate, // ← 修正済み
      fullDate: `${selectedDate} ${end.toLocaleTimeString()}`, // ← 修正済み
    };

    const updated = [...records, newRecord];
    setRecords(updated);
    localStorage.setItem("fortnite_records", JSON.stringify(updated));

    setStartTime(null);
    setElapsed(0);
  };

  const deleteRecord = (index) => {
    const updated = records.filter((_, i) => i !== index);
    setRecords(updated);
    localStorage.setItem("fortnite_records", JSON.stringify(updated));
  };

  const addTestTime = (minutes) => {
    if (!practiceType) {
      alert("練習内容を選択してください");
      return;
    }

    const now = new Date();
    const newRecord = {
      type: practiceType,
      start: "--",
      end: "--",
      minutes,
      date: selectedDate, // ← 修正済み
      fullDate: `${selectedDate} ${now.toLocaleTimeString()}`, // ← 修正済み
    };

    const updated = [...records, newRecord];
    setRecords(updated);
    localStorage.setItem("fortnite_records", JSON.stringify(updated));
  };

  const groupedByDate = records.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = [];
    acc[r.date].push(r);
    return acc;
  }, {});

  const selectedRecords = groupedByDate[selectedDate] || [];

  const dailyTotals = {};
  selectedRecords.forEach((r) => {
    dailyTotals[r.type] = (dailyTotals[r.type] || 0) + r.minutes;
  });
  // 練習内容ごとの固定色
  const colorMap = {
    "エイム練習": "#60a5fa",   // 青
    "建築練習": "#34d399",     // 緑
    "編集練習": "#fbbf24",     // 黄
    "初動ファイト": "#f87171", // 赤
    "リプレイ研究": "#a78bfa", // 紫
  };

  const dailyChartData = {
    labels: Object.keys(dailyTotals),
    datasets: [
      {
        data: Object.values(dailyTotals),
        backgroundColor: Object.keys(dailyTotals).map(
          (type) => colorMap[type] || "#ffffff"
        ),
      },
    ],
  };

  const getWeeklyTotal = () => {
    const thisWeek = dayjs(selectedDate).isoWeek();
    let total = 0;

    records.forEach((r) => {
      if (dayjs(r.date).isoWeek() === thisWeek) {
        total += r.minutes;
      }
    });

    return total;
  };

  // 週グラフ
  const weeklyData = getWeeklyChartData(records);
  const weeklyChartData = {
    labels: Object.keys(weeklyData).map((w) => `Week ${w}`),
    datasets: [
      {
        label: "週の合計練習時間（分）",
        data: Object.values(weeklyData),
        backgroundColor: "rgba(99, 102, 241, 0.7)",
      },
    ],
  };

  // 日ごとの折れ線グラフ
  const dailyTotalsAll = getDailyTotals(records);
  const lineChartData = {
    labels: Object.keys(dailyTotalsAll),
    datasets: [
      {
        label: "1日の合計練習時間（分）",
        data: Object.values(dailyTotalsAll),
        borderColor: "rgba(56, 189, 248, 1)",
        backgroundColor: "rgba(56, 189, 248, 0.3)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">

      <style>{`
        .react-calendar {
          background-color: #1f2937 !important;
          color: white !important;
          border: 2px solid #7c3aed !important;
          border-radius: 12px;
          padding: 10px;
        }
        .react-calendar__tile {
          background: transparent !important;
          color: white !important;
          border-radius: 8px;
        }
        .react-calendar__tile--active {
          background: #2563eb !important;
          color: white !important;
          box-shadow: 0 0 10px #3b82f6;
        }
        .react-calendar__tile:hover {
          background: #1e40af !important;
        }
        .react-calendar__tile--now {
          background: rgba(168, 85, 247, 0.3) !important;
          border: 2px solid #a855f7 !important;
          color: #ffffff !important;
          box-shadow: 0 0 12px #a855f7;
        }
      `}</style>

      <h1 className="text-4xl font-extrabold text-blue-400 mb-8">
        Fortnite 練習トラッカー
      </h1>

      {/* カレンダー＋日別グラフ */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-purple-500">
          <h2 className="text-xl font-bold text-purple-300 mb-2">日付を選択</h2>

          <Calendar
            onChange={(value) =>
              setSelectedDate(dayjs(value).format("YYYY-MM-DD"))
            }
            value={new Date(selectedDate)}
          />
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-blue-300">
            {selectedDate} の練習割合
          </h2>

          {selectedRecords.length > 0 ? (
            <Doughnut data={dailyChartData} />
          ) : (
            <p className="text-gray-400">この日の記録はありません</p>
          )}
        </div>
      </div>

      {/* タイマー */}
      <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-xl shadow-lg mt-10">

        <select
          value={practiceType}
          onChange={(e) => setPracticeType(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-700"
        >
          <option value="">練習内容を選択</option>
          <option value="エイム練習">エイム練習</option>
          <option value="建築練習">建築練習</option>
          <option value="編集練習">編集練習</option>
          <option value="初動ファイト">初動ファイト</option>
          <option value="リプレイ研究">リプレイ研究</option>
        </select>

        <div className="text-center text-3xl font-bold mb-4">
          {Math.floor(elapsed / 60)}分 {elapsed % 60}秒
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="flex-1 bg-green-500 hover:bg-green-600 p-3 rounded font-bold disabled:bg-gray-600"
          >
            スタート
          </button>

          <button
            onClick={handlePause}
            disabled={!isRunning}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 p-3 rounded font-bold disabled:bg-gray-600"
          >
            一時停止
          </button>

          <button
            onClick={handleStop}
            disabled={elapsed === 0}
            className="flex-1 bg-red-500 hover:bg-red-600 p-3 rounded font-bold disabled:bg-gray-600"
          >
            ストップ
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <button onClick={() => addTestTime(1)} className="bg-blue-500 p-2 rounded">
            +1分
          </button>
          <button onClick={() => addTestTime(5)} className="bg-blue-500 p-2 rounded">
            +5分
          </button>
          <button onClick={() => addTestTime(30)} className="bg-blue-500 p-2 rounded">
            +30分
          </button>
          <button onClick={() => addTestTime(60)} className="bg-blue-500 p-2 rounded">
            +60分
          </button>
        </div>
      </div>

      {/* 記録一覧 */}
      <div className="w-full max-w-6xl mt-12">
        <h2 className="text-2xl font-bold mb-4 text-blue-300">
          {selectedDate} の記録一覧
        </h2>

        {selectedRecords.length === 0 && (
          <p className="text-gray-400">まだ記録がありません</p>
        )}

        {selectedRecords.map((r, i) => (
          <div
            key={i}
            className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 relative mb-3"
          >
            <button
              onClick={() => deleteRecord(records.indexOf(r))}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              削除
            </button>

            <p className="font-bold text-blue-300 text-lg">{r.type}</p>
            <p>
              {r.start} 〜 {r.end}（{r.minutes} 分）
            </p>
            <p className="text-sm text-gray-400">{r.fullDate}</p>
          </div>
        ))}

        <h2 className="text-xl font-bold text-green-400 mt-4">
          この週の合計: {getWeeklyTotal()} 分
        </h2>

        {/* 週グラフ */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mt-10">
          <h2 className="text-2xl font-bold mb-4 text-purple-300">
            週ごとの練習時間グラフ
          </h2>
          <Bar data={weeklyChartData} />
        </div>

        {/* 日ごとの折れ線グラフ */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mt-10">
          <h2 className="text-2xl font-bold mb-4 text-cyan-300">
            日ごとの練習時間推移
          </h2>
          <Line data={lineChartData} />
        </div>
      </div>
    </div>
  );
}
