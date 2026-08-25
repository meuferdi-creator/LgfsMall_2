import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  X, 
  Image as ImageIcon, 
  FileText, 
  Upload, 
  ArrowUp, 
  ArrowDown, 
  AlertTriangle, 
  Star, 
  Percent, 
  Calendar, 
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { InvestmentProject, InvestmentProjectStatus, InvestmentProjectDocument } from "../types";

interface AdminInvestmentProjectsProps {
  investmentProjects: InvestmentProject[];
  createInvestmentProject: (data: Partial<InvestmentProject>) => Promise<boolean>;
  updateInvestmentProject: (id: string, data: Partial<InvestmentProject>) => Promise<boolean>;
  deleteInvestmentProject: (id: string) => Promise<boolean>;
  fetchInvestmentProjects: (status?: string, search?: string) => Promise<void>;
  formatCurrency: (value: number) => string;
  isLoading: boolean;
}

export default function AdminInvestmentProjects({
  investmentProjects,
  createInvestmentProject,
  updateInvestmentProject,
  deleteInvestmentProject,
  fetchInvestmentProjects,
  formatCurrency,
  isLoading
}: AdminInvestmentProjectsProps) {
  // Search, filter & pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"ALL" | InvestmentProjectStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<InvestmentProject | null>(null);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<InvestmentProject | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<InvestmentProject | null>(null);

  // Form inputs state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTargetAmount, setFormTargetAmount] = useState("");
  const [formEstimatedReturn, setFormEstimatedReturn] = useState("");
  const [formDuration, setFormDuration] = useState("12");
  const [formDurationUnit, setFormDurationUnit] = useState("MONTHS");
  const [formStatus, setFormStatus] = useState<InvestmentProjectStatus>("DRAFT");
  
  // Media state for form
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formCoverImage, setFormCoverImage] = useState<string | null>(null);
  const [formDocuments, setFormDocuments] = useState<InvestmentProjectDocument[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered & searched projects
  const filteredProjects = useMemo(() => {
    return investmentProjects.filter((p) => {
      const matchesStatus = selectedStatusFilter === "ALL" || p.status === selectedStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) || 
        p.id.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [investmentProjects, selectedStatusFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(start, start + itemsPerPage);
  }, [filteredProjects, currentPage, itemsPerPage]);

  // Open creation modal
  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setFormTitle("");
    setFormDescription("");
    setFormTargetAmount("");
    setFormEstimatedReturn("12.5");
    setFormDuration("12");
    setFormDurationUnit("MONTHS");
    setFormStatus("DRAFT");
    setFormImages([]);
    setFormCoverImage(null);
    setFormDocuments([]);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (project: InvestmentProject) => {
    setEditingProject(project);
    setFormTitle(project.title);
    setFormDescription(project.description);
    setFormTargetAmount(project.targetAmount.toString());
    setFormEstimatedReturn(project.estimatedReturn.toString());
    setFormDuration(project.investmentDuration.toString());
    setFormDurationUnit(project.investmentDurationUnit || "MONTHS");
    setFormStatus(project.status);

    let imgs: string[] = [];
    if (Array.isArray(project.images)) {
      imgs = project.images;
    } else if (typeof project.images === "string") {
      try { imgs = JSON.parse(project.images); } catch (e) { imgs = []; }
    }
    if (imgs.length === 0 && project.coverImage) {
      imgs = [project.coverImage];
    }

    let docs: InvestmentProjectDocument[] = [];
    if (Array.isArray(project.documents)) {
      docs = project.documents;
    } else if (typeof project.documents === "string") {
      try { docs = JSON.parse(project.documents); } catch (e) { docs = []; }
    }

    setFormImages(imgs);
    setFormCoverImage(project.coverImage || (imgs.length > 0 ? imgs[0] : null));
    setFormDocuments(docs);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open detail view modal
  const handleOpenDetailModal = (project: InvestmentProject) => {
    setViewingProject(project);
    setIsDetailModalOpen(true);
  };

  // Open delete confirmation modal
  const handleOpenDeleteModal = (project: InvestmentProject) => {
    setDeletingProject(project);
    setIsDeleteModalOpen(true);
  };

  // Handle image upload (Base64 conversion)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setFormError("Format de fichier non supporté. Seules les images sont autorisées.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError("Image trop volumineuse (max 5Mo par image).");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setFormImages((prev) => {
            const newImgs = [...prev, result];
            if (!formCoverImage) {
              setFormCoverImage(result);
            }
            return newImgs;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Move image order
  const handleMoveImage = (index: number, direction: "up" | "down") => {
    const newImages = [...formImages];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setFormImages(newImages);
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    const removedUrl = formImages[index];
    const newImages = formImages.filter((_, i) => i !== index);
    setFormImages(newImages);

    if (formCoverImage === removedUrl) {
      setFormCoverImage(newImages.length > 0 ? newImages[0] : null);
    }
  };

  // Handle document upload
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        setFormError("Document trop volumineux (max 10Mo par fichier).");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const newDoc: InvestmentProjectDocument = {
            id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            url: result,
            type: file.type || "application/pdf",
            size: file.size
          };
          setFormDocuments((prev) => [...prev, newDoc]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove document
  const handleRemoveDocument = (id?: string) => {
    if (!id) return;
    setFormDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Form Validations
    if (!formTitle.trim()) {
      setFormError("Le titre du projet est obligatoire.");
      return;
    }
    if (!formDescription.trim()) {
      setFormError("La description détaillée du projet est obligatoire.");
      return;
    }
    const parsedAmount = parseFloat(formTargetAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Le montant cible doit être une valeur numérique supérieure à 0.");
      return;
    }
    const parsedReturn = parseFloat(formEstimatedReturn);
    if (isNaN(parsedReturn) || parsedReturn < 0) {
      setFormError("Le rendement estimé doit être une valeur numérique valide.");
      return;
    }
    const parsedDuration = parseInt(formDuration, 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      setFormError("La durée d'investissement est obligatoire et doit être supérieure à 0.");
      return;
    }

    setIsSubmitting(true);

    const projectData: Partial<InvestmentProject> = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      targetAmount: parsedAmount,
      estimatedReturn: parsedReturn,
      investmentDuration: parsedDuration,
      investmentDurationUnit: formDurationUnit,
      status: formStatus,
      coverImage: formCoverImage || (formImages.length > 0 ? formImages[0] : null),
      images: formImages,
      documents: formDocuments
    };

    let success = false;
    if (editingProject) {
      success = await updateInvestmentProject(editingProject.id, projectData);
    } else {
      success = await createInvestmentProject(projectData);
    }

    setIsSubmitting(false);

    if (success) {
      setIsFormModalOpen(false);
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingProject) return;
    setIsSubmitting(true);
    const success = await deleteInvestmentProject(deletingProject.id);
    setIsSubmitting(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setDeletingProject(null);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: InvestmentProjectStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center space-x-1 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Actif</span>
          </span>
        );
      case "DRAFT":
        return (
          <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200 inline-flex items-center space-x-1 uppercase">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Brouillon</span>
          </span>
        );
      case "COMPLETED":
        return (
          <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-blue-200 inline-flex items-center space-x-1 uppercase">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Terminé</span>
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-rose-200 inline-flex items-center space-x-1 uppercase">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>Suspendu</span>
          </span>
        );
      default:
        return <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* MODULE TOP BAR */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-black text-emerald-950 font-display">
              Gestion des Projets d'Investissement
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Création, modification, médias et suivi des opportunités de financement LGF.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer self-start md:self-auto hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Publier un projet</span>
        </button>
      </div>

      {/* CONTROLS: SEARCH & STATUS FILTER */}
      <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre, description ou ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {(["ALL", "DRAFT", "ACTIVE", "COMPLETED", "SUSPENDED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setSelectedStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatusFilter === st
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" ? "Tous" : st === "DRAFT" ? "Brouillon" : st === "ACTIVE" ? "Actif" : st === "COMPLETED" ? "Terminé" : "Suspendu"}
            </button>
          ))}
        </div>
      </div>

      {/* DATA TABLE VIEW */}
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 font-mono tracking-wider">
                <th className="p-4">Projet</th>
                <th className="p-4">Montant Cible</th>
                <th className="p-4">Rendement</th>
                <th className="p-4">Durée</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Création</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">Aucun projet d'investissement trouvé.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {searchQuery || selectedStatusFilter !== "ALL"
                        ? "Essayez d'ajuster vos filtres de recherche."
                        : "Cliquez sur « Publier un projet » pour commencer."}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((project) => {
                  const imagesList = Array.isArray(project.images) 
                    ? project.images 
                    : typeof project.images === "string" 
                    ? JSON.parse(project.images || "[]") 
                    : [];
                  const cover = project.coverImage || (imagesList.length > 0 ? imagesList[0] : null);

                  return (
                    <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Project info & image */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {cover ? (
                              <img src={cover} alt={project.title} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1 max-w-xs">{project.title}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">{project.description}</p>
                          </div>
                        </div>
                      </td>

                      {/* Target Amount */}
                      <td className="p-4 font-black text-slate-900 font-mono">
                        {formatCurrency(project.targetAmount)}
                      </td>

                      {/* Estimated ROI */}
                      <td className="p-4 font-bold text-emerald-600 font-mono">
                        {project.estimatedReturn}%
                      </td>

                      {/* Duration */}
                      <td className="p-4 text-slate-700 font-medium">
                        {project.investmentDuration} {project.investmentDurationUnit === "YEARS" ? "ans" : project.investmentDurationUnit === "DAYS" ? "jours" : "mois"}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {renderStatusBadge(project.status)}
                      </td>

                      {/* Created At */}
                      <td className="p-4 text-slate-500 text-[11px] font-mono">
                        {new Date(project.createdAt).toLocaleDateString("fr-FR")}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenDetailModal(project)}
                            title="Voir les détails"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(project)}
                            title="Modifier le projet"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenDeleteModal(project)}
                            title="Supprimer le projet"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {filteredProjects.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Affichage <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> à{" "}
              <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredProjects.length)}</span> sur{" "}
              <span className="font-bold text-slate-900">{filteredProjects.length}</span> projets
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-all cursor-pointer flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Précédent</span>
              </button>

              <span className="font-mono text-xs font-bold px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-all cursor-pointer flex items-center space-x-1"
              >
                <span>Suivant</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FORM MODAL (CREATE / EDIT) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-slate-950/80 transition-opacity" 
            onClick={() => setIsFormModalOpen(false)} 
            aria-hidden="true" 
          />
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-emerald-100 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-scale-in">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                  {editingProject ? "Modifier le projet d'investissement" : "Nouveau projet d'investissement"}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-900 text-xs font-semibold rounded-r-xl flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Titre du projet <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Projet Agricole Bio Lomé - Karité & Cacao"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Description & Objectives */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Description détaillée & Objectifs <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Présentation du contexte, objectifs de levée de fonds, utilisation des capitaux, garanties investisseurs..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Amount, Return & Duration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Target Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Montant cible (FCFA) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1000"
                    placeholder="50000000"
                    value={formTargetAmount}
                    onChange={(e) => setFormTargetAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {parseFloat(formTargetAmount) > 0 && (
                    <p className="text-[10px] text-emerald-600 font-mono font-bold mt-1">
                      Preview: {formatCurrency(parseFloat(formTargetAmount))}
                    </p>
                  )}
                </div>

                {/* Estimated Return */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Rendement estimé (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="15.0"
                    value={formEstimatedReturn}
                    onChange={(e) => setFormEstimatedReturn(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Durée d'investissement <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex space-x-1.5">
                    <input
                      type="number"
                      required
                      min="1"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      className="w-1/2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <select
                      value={formDurationUnit}
                      onChange={(e) => setFormDurationUnit(e.target.value)}
                      className="w-1/2 px-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="MONTHS">Mois</option>
                      <option value="YEARS">Ans</option>
                      <option value="DAYS">Jours</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Statut du projet
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { value: "DRAFT", label: "Brouillon", color: "bg-slate-100 border-slate-300 text-slate-800" },
                      { value: "ACTIVE", label: "Actif", color: "bg-emerald-100 border-emerald-300 text-emerald-900" },
                      { value: "COMPLETED", label: "Terminé", color: "bg-blue-100 border-blue-300 text-blue-900" },
                      { value: "SUSPENDED", label: "Suspendu", color: "bg-rose-100 border-rose-300 text-rose-900" }
                    ] as const
                  ).map((st) => (
                    <button
                      type="button"
                      key={st.value}
                      onClick={() => setFormStatus(st.value)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        formStatus === st.value
                          ? `${st.color} ring-2 ring-emerald-500 shadow-xs`
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* GALLERY & COVER IMAGE UPLOADER */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>Galerie d'images & Image principale</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Importez une ou plusieurs images. Cliquez sur l'étoile pour choisir l'image principale.
                    </p>
                  </div>

                  <label className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ajouter des images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Images grid */}
                {formImages.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Aucune image sélectionnée.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {formImages.map((imgUrl, idx) => {
                      const isCover = formCoverImage === imgUrl;
                      return (
                        <div
                          key={idx}
                          className={`relative rounded-2xl overflow-hidden border-2 bg-slate-100 dark:bg-slate-800 group ${
                            isCover ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <img src={imgUrl} alt={`Aperçu ${idx + 1}`} className="w-full h-24 object-cover" />

                          {/* Cover badge */}
                          {isCover && (
                            <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono shadow-xs">
                              Cover
                            </span>
                          )}

                          {/* Action overlay */}
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1 p-1">
                            {/* Make cover button */}
                            <button
                              type="button"
                              onClick={() => setFormCoverImage(imgUrl)}
                              title="Définir comme image principale"
                              className={`p-1.5 rounded-lg text-white transition-colors cursor-pointer ${
                                isCover ? "bg-amber-500" : "bg-slate-800 hover:bg-amber-500"
                              }`}
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>

                            {/* Move left/up */}
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, "up")}
                                title="Déplacer vers la gauche"
                                className="p-1.5 bg-slate-800 hover:bg-emerald-600 rounded-lg text-white transition-colors cursor-pointer"
                              >
                                <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                              </button>
                            )}

                            {/* Move right/down */}
                            {idx < formImages.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, "down")}
                                title="Déplacer vers la droite"
                                className="p-1.5 bg-slate-800 hover:bg-emerald-600 rounded-lg text-white transition-colors cursor-pointer"
                              >
                                <ArrowDown className="w-3.5 h-3.5 -rotate-90" />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              title="Supprimer"
                              className="p-1.5 bg-rose-600 hover:bg-rose-700 rounded-lg text-white transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* DOCUMENTS JUSTIFICATIFS */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>Documents justificatifs (PDF, Contrats, Etudes)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Rapports financiers, business plan ou documents légaux pour les investisseurs.
                    </p>
                  </div>

                  <label className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ajouter document</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      onChange={handleDocumentUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {formDocuments.length === 0 ? (
                  <div className="p-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center text-slate-400 text-xs">
                    Aucun document joint.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formDocuments.map((doc) => (
                      <div
                        key={doc.id || doc.name}
                        className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.name}</span>
                          {doc.size && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({(doc.size / 1024).toFixed(0)} Ko)
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Controls */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>{editingProject ? "Enregistrer les modifications" : "Publier le projet"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL VIEW */}
      {isDetailModalOpen && viewingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-slate-950/80 transition-opacity" 
            onClick={() => setIsDetailModalOpen(false)} 
            aria-hidden="true" 
          />
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-emerald-100 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-scale-in">
            {/* Header / Cover */}
            <div className="relative h-48 bg-slate-900 overflow-hidden">
              {viewingProject.coverImage ? (
                <img
                  src={viewingProject.coverImage}
                  alt={viewingProject.title}
                  className="w-full h-full object-cover opacity-80"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <ImageIcon className="w-12 h-12" />
                </div>
              )}

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-4 right-4 bg-slate-950/60 text-white p-2 rounded-full hover:bg-slate-950 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-4 right-4">
                {renderStatusBadge(viewingProject.status)}
                <h3 className="text-xl font-black text-white mt-1 drop-shadow-md">
                  {viewingProject.title}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Montant Cible</span>
                  <p className="text-base font-black text-emerald-900 dark:text-emerald-100 font-mono mt-0.5">
                    {formatCurrency(viewingProject.targetAmount)}
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/50 p-3 rounded-2xl border border-amber-100 dark:border-amber-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Rendement Estimé</span>
                  <p className="text-base font-black text-amber-900 dark:text-amber-100 font-mono mt-0.5">
                    {viewingProject.estimatedReturn}%
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-2xl border border-blue-100 dark:border-blue-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Durée</span>
                  <p className="text-base font-black text-blue-900 dark:text-blue-100 font-mono mt-0.5">
                    {viewingProject.investmentDuration} {viewingProject.investmentDurationUnit === "YEARS" ? "ans" : "mois"}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 font-mono mb-1">Description & Objectifs</h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {viewingProject.description}
                </p>
              </div>

              {/* Gallery */}
              {Array.isArray(viewingProject.images) && viewingProject.images.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 font-mono mb-2">Galerie Média</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingProject.images.map((img, i) => (
                      <div key={i} className="h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                        <img src={img} alt={`Projet ${i}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {Array.isArray(viewingProject.documents) && viewingProject.documents.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 font-mono mb-2">Documents Joints</h4>
                  <div className="space-y-1.5">
                    {viewingProject.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span className="font-semibold">{doc.name}</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold hover:underline">Consulter ↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-slate-950/80 transition-opacity" 
            onClick={() => setIsDeleteModalOpen(false)} 
            aria-hidden="true" 
          />
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-rose-100 dark:border-rose-900/30 shadow-2xl p-6 space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                Supprimer ce projet ?
              </h3>
              <p className="text-xs text-slate-500">
                Êtes-vous sûr de vouloir supprimer définitivement le projet «{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">{deletingProject.title}</span> » ?
              </p>
              <p className="text-[11px] text-rose-500 font-semibold mt-1">
                Cette action est irréversible.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Suppression...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer définitivement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
