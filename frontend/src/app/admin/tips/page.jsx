// frontend/src/app/admin/tips/page.jsx
"use client";

import { useEffect, useState } from "react";
import { adminApi } from "../../../api/admin.api";
import { formatOdds, formatDate, outcomeColor, statusColor } from "../../../lib/utils";
import toast from "react-hot-toast";
import { Trophy, Plus, Search, Filter, CheckCircle, XCircle, Edit, Trash2, Send } from "lucide-react";
import Modal from "../../../components/Modal";

export default function AdminTipsPage() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTipIds, setSelectedTipIds] = useState([]);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    teams: "",
    homeTeam: "",
    awayTeam: "",
    sport: "Football",
    competition: "",
    market: "Match Winner",
    selection: "1",
    odds: 1.85,
    kickoff: "",
  });

  // Settle Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [targetTip, setTargetTip] = useState(null);
  const [settleOutcome, setSettleOutcome] = useState("WON");

  const loadTips = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getTips();
      const list = res?.tips || res?.data || res || [];
      setTips(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error("Failed loading admin tips list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTips();
  }, []);

  const handleCreateTip = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createTip(createForm);
      toast.success("Tip created successfully");
      setCreateModalOpen(false);
      loadTips();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed creating tip");
    }
  };

  const handlePublish = async (id) => {
    try {
      await adminApi.publishTip(id);
      toast.success("Tip published");
      loadTips();
    } catch {
      toast.error("Failed publishing tip");
    }
  };

  const handleUnpublish = async (id) => {
    try {
      await adminApi.unpublishTip(id);
      toast.success("Tip unpublished");
      loadTips();
    } catch {
      toast.error("Failed unpublishing tip");
    }
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    if (!targetTip) return;
    try {
      await adminApi.settleTip(targetTip.id, { outcome: settleOutcome });
      toast.success(`Tip settled as ${settleOutcome}`);
      setSettleModalOpen(false);
      loadTips();
    } catch {
      toast.error("Failed settling tip");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this tip?")) return;
    try {
      await adminApi.deleteTip(id);
      toast.success("Tip deleted");
      loadTips();
    } catch {
      toast.error("Failed deleting tip");
    }
  };

  // Bulk Operations
  const handleBulkPublish = async () => {
    if (selectedTipIds.length === 0) return;
    try {
      await adminApi.publishTipsBulk(selectedTipIds);
      toast.success(`Published ${selectedTipIds.length} tips`);
      setSelectedTipIds([]);
      loadTips();
    } catch {
      toast.error("Bulk publish failed");
    }
  };

  const handleBulkUnpublish = async () => {
    if (selectedTipIds.length === 0) return;
    try {
      await adminApi.unpublishTipsBulk(selectedTipIds);
      toast.success(`Unpublished ${selectedTipIds.length} tips`);
      setSelectedTipIds([]);
      loadTips();
    } catch {
      toast.error("Bulk unpublish failed");
    }
  };

  const toggleSelectAll = () => {
    if (selectedTipIds.length === filteredTips.length) {
      setSelectedTipIds([]);
    } else {
      setSelectedTipIds(filteredTips.map((t) => t.id));
    }
  };

  const toggleSelectTip = (id) => {
    setSelectedTipIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredTips = tips.filter((t) => {
    const matchStr = `${t.teams} ${t.homeTeam} ${t.awayTeam} ${t.competition} ${t.selection}`.toLowerCase();
    const matchesSearch = matchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || (t.status || "PUBLISHED") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-400" />
            Tips & Curation Engine
          </h1>
          <p className="text-slate-400 text-xs">Create, publish, settle, or manage product visibility for daily tips.</p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Tip</span>
        </button>
      </div>

      {/* Filter & Bulk bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Filter teams, selection..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 pl-9"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="SETTLED">SETTLED</option>
            <option value="PENDING">PENDING</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {selectedTipIds.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-emerald-400">{selectedTipIds.length} Selected</span>
            <button
              onClick={handleBulkPublish}
              className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px] font-bold hover:bg-emerald-500/20"
            >
              Bulk Publish
            </button>
            <button
              onClick={handleBulkUnpublish}
              className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[11px] font-bold hover:bg-amber-500/20"
            >
              Bulk Unpublish
            </button>
          </div>
        )}
      </div>

      {/* Tips Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading tips...</div>
        ) : filteredTips.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedTipIds.length === filteredTips.length && filteredTips.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3">Match / Teams</th>
                  <th className="px-4 py-3">Selection</th>
                  <th className="px-4 py-3">Odds</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTipIds.includes(t.id)}
                        onChange={() => toggleSelectTip(t.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-100">{t.teams || `${t.homeTeam} vs ${t.awayTeam}`}</div>
                      <div className="text-[10px] text-slate-400">{t.sport} • {t.competition}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-emerald-400">{t.selection}</div>
                      <div className="text-[10px] text-slate-400">{t.market}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-400">@{formatOdds(t.odds)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor(t.status)}`}>
                        {t.status || "PUBLISHED"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.result?.outcome || t.outcome ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${outcomeColor(t.result?.outcome || t.outcome)}`}>
                          {t.result?.outcome || t.outcome}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      {t.status === "PUBLISHED" ? (
                        <button
                          onClick={() => handleUnpublish(t.id)}
                          className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[11px] font-semibold hover:bg-amber-500/20"
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePublish(t.id)}
                          className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px] font-semibold hover:bg-emerald-500/20"
                        >
                          Publish
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setTargetTip(t);
                          setSettleOutcome(t.result?.outcome || "WON");
                          setSettleModalOpen(true);
                        }}
                        className="px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[11px] font-semibold hover:bg-indigo-500/20"
                      >
                        Settle
                      </button>

                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Tip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">No tips found.</div>
        )}
      </div>

      {/* Create Tip Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Betting Tip">
        <form onSubmit={handleCreateTip} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Teams / Match *</label>
            <input
              type="text"
              required
              placeholder="Arsenal vs Chelsea"
              value={createForm.teams}
              onChange={(e) => setCreateForm({ ...createForm, teams: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Sport</label>
              <input
                type="text"
                value={createForm.sport}
                onChange={(e) => setCreateForm({ ...createForm, sport: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Competition</label>
              <input
                type="text"
                placeholder="Premier League"
                value={createForm.competition}
                onChange={(e) => setCreateForm({ ...createForm, competition: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Market</label>
              <input
                type="text"
                value={createForm.market}
                onChange={(e) => setCreateForm({ ...createForm, market: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Selection *</label>
              <input
                type="text"
                required
                placeholder="Arsenal to Win"
                value={createForm.selection}
                onChange={(e) => setCreateForm({ ...createForm, selection: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Odds *</label>
              <input
                type="number"
                step="0.01"
                required
                value={createForm.odds}
                onChange={(e) => setCreateForm({ ...createForm, odds: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-md mt-2"
          >
            Create Tip Now
          </button>
        </form>
      </Modal>

      {/* Settle Tip Modal */}
      <Modal isOpen={settleModalOpen} onClose={() => setSettleModalOpen(false)} title="Settle Match Result">
        <form onSubmit={handleSettleSubmit} className="space-y-4 text-xs">
          <p className="text-slate-300">
            Match: <strong className="text-slate-100">{targetTip?.teams}</strong> ({targetTip?.selection})
          </p>

          <div>
            <label className="block text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
              Outcome Result
            </label>
            <select
              value={settleOutcome}
              onChange={(e) => setSettleOutcome(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-bold"
            >
              <option value="WON">WON (100% Win)</option>
              <option value="HALF_WON">HALF_WON (Half Win)</option>
              <option value="LOST">LOST (Full Loss)</option>
              <option value="HALF_LOST">HALF_LOST (Half Loss)</option>
              <option value="VOID">VOID / PUSH (Stake Returned)</option>
              <option value="CANCELLED">CANCELLED (Match Postponed)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md"
          >
            Save Settlement
          </button>
        </form>
      </Modal>
    </div>
  );
}
