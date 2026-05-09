import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Dashboard({ user }) {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [activeTab, setActiveTab] = useState("summarize"); 
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const logout = async () => {
    await signOut(auth);
  };

const generateSummary = async () => {
  if (!text.trim()) return alert("Paste some text first!");
  setLoading(true);
  setSummary("");
  try {
    const res = await fetch(`${API_URL}/api/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    console.log("Server response:", data); 

    const result = data.summary || data.text || data.content || data.result || "";
    
    if (!result) {
      console.error("Full response:", JSON.stringify(data));
      alert("AI nu a returnat un răspuns. Vezi consola.");
      return;
    }

    setSummary(result);

    if (result && user) {
      await addDoc(collection(db, "summaries"), {
        userId: user.uid,
        inputText: text.slice(0, 300) + (text.length > 300 ? "..." : ""),
        summary: result,
        type: "summary",
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("Fetch error:", err);
    alert("Error: " + err.message);
  } finally {
    setLoading(false);
  }
};

  const generateQuiz = async () => {
    if (!text.trim()) return alert("Paste some text first!");
    setLoading(true);
    setQuiz([]);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    try {
      const res = await fetch(`${API_URL}/api/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setQuiz(data.questions);
      setActiveTab("quiz");

      await addDoc(collection(db, "summaries"), {
        userId: user.uid,
        inputText: text.slice(0, 300) + (text.length > 300 ? "..." : ""),
        summary: `Quiz generat: ${data.questions.length} întrebări`,
        type: "quiz",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      alert("Error generating quiz.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qIndex, option) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const submitQuiz = () => {
    if (Object.keys(selectedAnswers).length < quiz.length) {
      return alert("Please answer all questions first!");
    }
    setQuizSubmitted(true);
  };

  const quizScore = quiz.reduce((acc, q, i) => {
    return selectedAnswers[i] === q.answer ? acc + 1 : acc;
  }, 0);

  const loadHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const q = query(
        collection(db, "summaries"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      setHistory(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteHistoryItem = async (id) => {
    await deleteDoc(doc(db, "summaries", id));
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  useEffect(() => {
    if (activeTab === "history") loadHistory();
  }, [activeTab]);

  const tabs = [
    { key: "summarize", label: "✦ Summarize" },
    { key: "quiz", label: "🧠 Quiz" },
    { key: "history", label: "📋 History" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Study Assistant</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Logged in as <span className="text-blue-400">{user?.email}</span>
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-500 px-4 py-2 rounded-lg transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Tabs */}
      <div className="px-8 pt-6 flex gap-2 border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="px-8 py-8 max-w-6xl mx-auto">

        {/* ── SUMMARIZE TAB ── */}
        {activeTab === "summarize" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
              <h2 className="text-lg font-semibold mb-4 text-gray-100">Paste your study text</h2>
              <textarea
                rows="14"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Paste course notes, textbook excerpts, lecture slides..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={generateSummary}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  {loading && activeTab === "summarize" ? "Generating..." : "✦ Generate Summary"}
                </button>
                <button
                  onClick={generateQuiz}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  {loading ? "Generating..." : "🧠 Generate Quiz"}
                </button>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
              <h2 className="text-lg font-semibold mb-4 text-gray-100">AI Summary</h2>
              <div className="bg-gray-800 rounded-xl p-4 min-h-[320px] text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {loading
                  ? <div className="flex items-center gap-2 text-blue-400"><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> Generating summary...</div>
                  : summary || <span className="text-gray-500">Your AI summary will appear here.</span>
                }
              </div>
              {summary && (
                <button
                  onClick={() => navigator.clipboard.writeText(summary)}
                  className="mt-3 text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Copy to clipboard
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── QUIZ TAB ── */}
        {activeTab === "quiz" && (
          <div className="max-w-2xl mx-auto">
            {quiz.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <p className="text-5xl mb-4">🧠</p>
                <p className="text-lg">No quiz generated yet.</p>
                <p className="text-sm mt-2">Go to Summarize tab, paste text and click Generate Quiz.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">{quiz.length} Questions</h2>
                  {quizSubmitted && (
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${quizScore >= quiz.length * 0.7 ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                      Score: {quizScore}/{quiz.length}
                    </span>
                  )}
                </div>

                {quiz.map((q, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <p className="font-medium text-gray-100 mb-4">
                      <span className="text-blue-400 mr-2">{i + 1}.</span>{q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const isSelected = selectedAnswers[i] === opt;
                        const isCorrect = opt === q.answer;
                        let cls = "border border-gray-700 bg-gray-800 text-gray-300";
                        if (quizSubmitted) {
                          if (isCorrect) cls = "border border-green-500 bg-green-900/30 text-green-300";
                          else if (isSelected && !isCorrect) cls = "border border-red-500 bg-red-900/30 text-red-300";
                        } else if (isSelected) {
                          cls = "border border-blue-500 bg-blue-900/30 text-blue-300";
                        }
                        return (
                          <button
                            key={opt}
                            onClick={() => handleAnswer(i, opt)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${cls}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {quizSubmitted && (
                      <p className="mt-3 text-xs text-gray-400">
                        <span className="text-green-400 font-medium">Correct: </span>{q.answer}
                      </p>
                    )}
                  </div>
                ))}

                {!quizSubmitted ? (
                  <button
                    onClick={submitQuiz}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-medium transition-colors"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => { setQuiz([]); setActiveTab("summarize"); }}
                    className="w-full border border-gray-700 hover:border-gray-500 py-3 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    ← New quiz
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === "history" && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-6">Your Activity History</h2>
            {historyLoading ? (
              <div className="text-center py-20 text-gray-500">Loading...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <p className="text-5xl mb-4">📋</p>
                <p>No history yet. Generate a summary or quiz to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.type === "quiz" ? "bg-purple-900 text-purple-300" : "bg-blue-900 text-blue-300"}`}>
                          {item.type === "quiz" ? "🧠 Quiz" : "✦ Summary"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.createdAt?.toDate?.()?.toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      <span className="text-gray-400">Input: </span>{item.inputText}
                    </p>
                    <p className="text-sm text-gray-300">{item.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
