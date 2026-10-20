import React, { useState, useEffect } from 'react';
import { BxTrainer } from '../../data/gymData';
import { VelocityAPI } from '../../services/api';
import { User } from '../../types';
import { Plus, Edit2, Trash2, ShieldCheck, Trophy, Star, CheckCircle2, X, RefreshCw, Image, UserCheck } from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface CoachesManagerProps {
  user: User;
  onShowToast: (msg: string) => void;
}

export const CoachesManager: React.FC<CoachesManagerProps> = ({ user, onShowToast }) => {
  const [trainers, setTrainers] = useState<BxTrainer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTrainer, setEditingTrainer] = useState<BxTrainer | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deletingTrainerTarget, setDeletingTrainerTarget] = useState<{ id: string; name: string } | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [coachPosition, setCoachPosition] = useState<string>('HEADCOACH');
  const [headline, setHeadline] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [secondaryBio, setSecondaryBio] = useState<string>('');
  const [specialtiesStr, setSpecialtiesStr] = useState<string>('');
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [clientsServed, setClientsServed] = useState<number>(1000);
  const [rating, setRating] = useState<number>(5.0);
  const [languagesStr, setLanguagesStr] = useState<string>('English');
  const [availability, setAvailability] = useState<string>('Mon - Sat (Flexible)');
  const [certifications, setCertifications] = useState<string[]>(['Certified Master Fitness & Combat Coach']);
  const [newCertText, setNewCertText] = useState<string>('');
  const [achievements, setAchievements] = useState<string[]>(['Over 98% Client Goal Success Rate']);
  const [newAchText, setNewAchText] = useState<string>('');
  const [instagram, setInstagram] = useState<string>('#');
  const [linkedin, setLinkedin] = useState<string>('#');
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');
  const [galleryVideos, setGalleryVideos] = useState<string[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchTrainers = async () => {
    setIsLoading(true);
    const data = await VelocityAPI.getTrainersAsync();
    setTrainers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const openAddModal = () => {
    setEditingTrainer(null);
    setName('');
    setRole('');
    setCoachPosition('HEADCOACH');
    setHeadline('');
    setImage('https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=80&w=600');
    setBio('');
    setSecondaryBio('');
    setSpecialtiesStr('Boxing, Strength & Conditioning, Rehabilitation');
    setExperienceYears(10);
    setClientsServed(1000);
    setRating(5.0);
    setLanguagesStr('English, Urdu');
    setAvailability('Mon - Sat (Morning & Evening)');
    setCertifications(['CIMSPA Level 4 Master Coach', 'Certified UK Fitness Specialist']);
    setAchievements(['Coached 100+ Athlete Transformations', 'Verified UK Master Trainer']);
    setGalleryPhotos([
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=800'
    ]);
    setGalleryVideos([
      'https://assets.mixkit.co/videos/preview/mixkit-boxer-getting-ready-for-a-fight-42994-large.mp4'
    ]);
    setInstagram('#');
    setLinkedin('#');
    setIsModalOpen(true);
  };

  const openEditModal = (trainer: BxTrainer) => {
    setEditingTrainer(trainer);
    setName(trainer.name);
    setRole(trainer.role);
    setCoachPosition(trainer.coachPosition || 'HEADCOACH');
    setHeadline(trainer.headline || '');
    setImage(trainer.image);
    setBio(trainer.bio);
    setSecondaryBio(trainer.secondaryBio || '');
    setSpecialtiesStr(trainer.specialties ? trainer.specialties.join(', ') : '');
    setExperienceYears(trainer.experienceYears || 5);
    setClientsServed(trainer.clientsServed || 1000);
    setRating(trainer.rating || 5.0);
    setLanguagesStr(trainer.languages ? trainer.languages.join(', ') : 'English');
    setAvailability(trainer.availability || 'Mon - Sat (Flexible)');
    setCertifications(trainer.certifications && trainer.certifications.length > 0 ? trainer.certifications : [trainer.certification || 'UK Certified Coach']);
    setAchievements(trainer.achievements && trainer.achievements.length > 0 ? trainer.achievements : ['Verified Performance Specialist']);
    setGalleryPhotos(trainer.galleryPhotos || []);
    setGalleryVideos(trainer.galleryVideos || []);
    setInstagram(trainer.socials?.instagram || '#');
    setLinkedin(trainer.socials?.linkedin || '#');
    setIsModalOpen(true);
  };

  const handleAddCert = () => {
    if (newCertText.trim()) {
      setCertifications([...certifications, newCertText.trim()]);
      setNewCertText('');
    }
  };

  const handleRemoveCert = (index: number) => {
    setCertifications(certifications.filter((_, idx) => idx !== index));
  };

  const handleAddAch = () => {
    if (newAchText.trim()) {
      setAchievements([...achievements, newAchText.trim()]);
      setNewAchText('');
    }
  };

  const handleRemoveAch = (index: number) => {
    setAchievements(achievements.filter((_, idx) => idx !== index));
  };

  const handleAddPhoto = () => {
    if (newPhotoUrl.trim()) {
      setGalleryPhotos([...galleryPhotos, newPhotoUrl.trim()]);
      setNewPhotoUrl('');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setGalleryPhotos(galleryPhotos.filter((_, idx) => idx !== index));
  };

  const handleAddVideo = () => {
    if (newVideoUrl.trim()) {
      setGalleryVideos([...galleryVideos, newVideoUrl.trim()]);
      setNewVideoUrl('');
    }
  };

  const handleRemoveVideo = (index: number) => {
    setGalleryVideos(galleryVideos.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !image.trim() || !bio.trim()) {
      onShowToast('Please fill in required fields: Name, Role, Image URL, and Bio.');
      return;
    }

    setIsSaving(true);
    const specialties = specialtiesStr.split(',').map(s => s.trim()).filter(Boolean);
    const languages = languagesStr.split(',').map(l => l.trim()).filter(Boolean);

    const payload: Partial<BxTrainer> = {
      name: name.trim(),
      role: role.trim(),
      coachPosition: coachPosition.trim(),
      headline: headline.trim() || `${coachPosition} | ${role.toUpperCase()}`,
      image: image.trim(),
      bio: bio.trim(),
      secondaryBio: secondaryBio.trim(),
      specialties,
      experienceYears: Number(experienceYears),
      clientsServed: Number(clientsServed),
      rating: Number(rating),
      languages,
      availability: availability.trim(),
      certification: certifications[0] || 'UK Certified Master Coach',
      certifications,
      achievements,
      galleryPhotos,
      galleryVideos,
      socials: { instagram, linkedin }
    };

    if (editingTrainer) {
      const res = await VelocityAPI.updateTrainerAsync(editingTrainer.id, payload);
      if (res.success) {
        onShowToast(`Coach card "${name}" updated live in database!`);
        setIsModalOpen(false);
        fetchTrainers();
        window.dispatchEvent(new CustomEvent('bxstrength_trainers_updated'));
      } else {
        onShowToast(res.error || 'Failed to update coach');
      }
    } else {
      const res = await VelocityAPI.addTrainerAsync(payload);
      if (res.success) {
        onShowToast(`Coach card "${name}" added live to database!`);
        setIsModalOpen(false);
        fetchTrainers();
        window.dispatchEvent(new CustomEvent('bxstrength_trainers_updated'));
      } else {
        onShowToast(res.error || 'Failed to add coach');
      }
    }
    setIsSaving(false);
  };

  const handleInitiateDelete = (id: string, coachName: string) => {
    setDeletingTrainerTarget({ id, name: coachName });
  };

  const executeDelete = async () => {
    if (!deletingTrainerTarget) return;
    const { id, name: coachName } = deletingTrainerTarget;
    setIsDeleting(id);
    setDeletingTrainerTarget(null);
    const res = await VelocityAPI.deleteTrainerAsync(id);
    if (res.success) {
      onShowToast(`Coach "${coachName}" deleted from database.`);
      fetchTrainers();
      window.dispatchEvent(new CustomEvent('bxstrength_trainers_updated'));
    } else {
      onShowToast(res.error || 'Failed to delete coach');
    }
    setIsDeleting(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#141416] border border-zinc-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-5 h-5 text-[#CCFF00]" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight">REAL-TIME COACH CARDS MANAGER</h2>
            <span className="bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              database Live Sync
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Add, update, or remove real coaches cards displayed live on the website. No hardcoded or dummy data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTrainers}
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl transition-all"
            title="Refresh Coach List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openAddModal}
            className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs tracking-wider uppercase px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ADD REAL COACH CARD</span>
          </button>
        </div>
      </div>

      {/* Coach Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-zinc-400 text-sm font-semibold flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#CCFF00]" />
          <span>Fetching Live Coaches from database Database...</span>
        </div>
      ) : trainers.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
          <UserCheck className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-sm text-zinc-300 font-bold">No coaches found in database.</p>
          <button
            onClick={openAddModal}
            className="text-xs bg-[#CCFF00] text-black font-bold px-4 py-2 rounded-lg inline-block"
          >
            Add First Coach Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((trainer) => (
            <div
              key={trainer.id}
              className="bg-[#141416] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition-all group"
            >
              {/* Photo & Badge Overlay */}
              <div className="relative aspect-[4/3] bg-zinc-900 overflow-hidden">
                <img
                  src={trainer.image}
                  alt={trainer.name}
                  className="w-full h-full object-cover object-center filter contrast-105 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <span className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-[#CCFF00] border border-zinc-800 text-[10px] font-black tracking-widest px-2.5 py-1 rounded uppercase">
                  {trainer.coachPosition || 'HEADCOACH'}
                </span>
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{trainer.name}</h3>
                  <p className="text-xs font-bold text-zinc-400">{trainer.role}</p>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="p-5 space-y-4 flex-grow">
                {trainer.headline && (
                  <p className="text-[11px] font-bold text-[#CCFF00] uppercase tracking-wider line-clamp-1">
                    {trainer.headline}
                  </p>
                )}

                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                  {trainer.bio}
                </p>

                {/* Certifications preview */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Verified Certifications ({trainer.certifications?.length || (trainer.certification ? 1 : 0)})
                  </span>
                  <p className="text-xs text-zinc-200 font-semibold line-clamp-1">
                    {trainer.certifications ? trainer.certifications.join(' • ') : trainer.certification}
                  </p>
                </div>

                {/* Achievements preview */}
                {trainer.achievements && trainer.achievements.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      Key Achievements ({trainer.achievements.length})
                    </span>
                    <p className="text-xs text-zinc-300 line-clamp-1">
                      {trainer.achievements[0]}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-400 font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {trainer.rating?.toFixed(1) || '5.0'} ({trainer.experienceYears || 5} Yrs Exp)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(trainer)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleInitiateDelete(trainer.id, trainer.name)}
                    disabled={isDeleting === trainer.id}
                    className="p-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    title="Delete Coach Card"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Coach Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#121214] border-0 sm:border border-zinc-800 rounded-none sm:rounded-2xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] p-4 sm:p-6 lg:p-8 space-y-6 relative shadow-2xl overflow-y-auto flex flex-col">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg bg-zinc-900 border border-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-xl text-[#CCFF00]">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  {editingTrainer ? 'EDIT COACH CARD DETAILS' : 'ADD NEW REAL COACH CARD'}
                </h3>
                <p className="text-xs text-zinc-400">
                  Data will be saved directly into database and displayed live on website coaches section.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">Coach Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Smith"
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Head Coach & Boxing Instructor"
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">Coach Position Tag</label>
                  <select
                    value={coachPosition}
                    onChange={(e) => setCoachPosition(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                  >
                    <option value="HEADCOACH">HEADCOACH</option>
                    <option value="COACH">COACH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">Headline Subtitle</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. HEAD COACH | BOXING INSTRUCTOR | PHYSIOTHERAPY"
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>
              </div>

              {/* Photo Image URL & Live Preview */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1 flex items-center gap-1">
                  <Image className="w-3.5 h-3.5 text-[#CCFF00]" />
                  Coach Photo Image URL *
                </label>
                <input
                  type="text"
                  required
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/... or hosted image path"
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                />
                {image && (
                  <div className="mt-2 flex items-center gap-3 bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
                    <img src={image} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                    <span className="text-[11px] text-zinc-400">Live Photo Preview</span>
                  </div>
                )}
              </div>

              {/* Primary & Secondary Bio */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">Primary Biography *</label>
                <textarea
                  required
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Detailed background, credentials, and coaching focus..."
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">Secondary Bio (Methodology / Approach)</label>
                <textarea
                  rows={2}
                  value={secondaryBio}
                  onChange={(e) => setSecondaryBio(e.target.value)}
                  placeholder="His/Her methodology bridges the gap between traditional strength training..."
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                />
              </div>

              {/* Specialties, Experience & Clients Served */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">Specialties (Comma Separated)</label>
                  <input
                    type="text"
                    value={specialtiesStr}
                    onChange={(e) => setSpecialtiesStr(e.target.value)}
                    placeholder="Boxing, Physiotherapy, Strength & Conditioning"
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">Years Exp</label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">Clients Served</label>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={clientsServed}
                    onChange={(e) => setClientsServed(Number(e.target.value))}
                    placeholder="1000"
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>
              </div>

              {/* Verified Certifications Editor */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="block text-[11px] font-bold text-zinc-300 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Verified UK Certifications List
                </label>
                <div className="space-y-2">
                  {certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-200">
                      <span className="font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {cert}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(idx)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCertText}
                    onChange={(e) => setNewCertText(e.target.value)}
                    placeholder="Add certification (e.g., REPs Level 4 Master Trainer)"
                    className="flex-grow bg-[#18181b] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCert}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-4 rounded-xl"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Achievements Editor */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="block text-[11px] font-bold text-zinc-300 uppercase flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Key Achievements & Milestones List
                </label>
                <div className="space-y-2">
                  {achievements.map((ach, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-200">
                      <span className="font-medium flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        {ach}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAch(idx)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAchText}
                    onChange={(e) => setNewAchText(e.target.value)}
                    placeholder="Add achievement (e.g., Coached 50+ Pro Fight Camps)"
                    className="flex-grow bg-[#18181b] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                  />
                  <button
                    type="button"
                    onClick={handleAddAch}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-4 rounded-xl"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Coach Physique Photos Gallery */}
              <div className="space-y-2 pt-3 border-t border-zinc-800">
                <label className="block text-[11px] font-bold text-zinc-300 uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#CCFF00]">
                    <Image className="w-4 h-4" />
                    Physique & Body Photos Gallery (Multiple Photo URLs)
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">Showcase Real Body & Fitness</span>
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {galleryPhotos.map((photo, idx) => (
                    <div key={idx} className="relative group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden aspect-video">
                      <img src={photo} alt={`Physique ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 bg-black/80 hover:bg-rose-600 text-white p-1 rounded-full opacity-90 transition-colors"
                        title="Remove Photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="Add Physique Photo Image URL (e.g. https://images.unsplash.com/...)"
                    className="flex-grow bg-[#18181b] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold text-xs px-4 rounded-xl cursor-pointer"
                  >
                    + Add Photo
                  </button>
                </div>
              </div>

              {/* Coach Physique & Training Videos Gallery */}
              <div className="space-y-2 pt-3 border-t border-zinc-800">
                <label className="block text-[11px] font-bold text-zinc-300 uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-pink-400">
                    <Trophy className="w-4 h-4" />
                    Physique & Workout Video Showcase (MP4 / WebM URLs)
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">Direct Video Links</span>
                </label>

                <div className="space-y-2">
                  {galleryVideos.map((video, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-200">
                      <div className="flex items-center gap-2 truncate max-w-[80%]">
                        <span className="bg-pink-950 text-pink-400 text-[10px] font-bold px-2 py-0.5 rounded border border-pink-800">VIDEO {idx + 1}</span>
                        <span className="truncate text-zinc-300 text-[11px] font-mono">{video}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(idx)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="Add Video URL (e.g. https://assets.mixkit.co/.../video.mp4)"
                    className="flex-grow bg-[#18181b] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                  />
                  <button
                    type="button"
                    onClick={handleAddVideo}
                    className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
                  >
                    + Add Video
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs tracking-widest uppercase py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>SAVING TO NEONDB DATABASE...</span>
                    </>
                  ) : (
                    <span>{editingTrainer ? 'UPDATE COACH CARD IN NEONDB' : 'SAVE & PUBLISH COACH CARD LIVE'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Double Confirmation Modal for Coach Deletion */}
      {deletingTrainerTarget && (
        <ConfirmModal
          isOpen={true}
          title="PERMANENTLY DELETE COACH CARD"
          message={`Are you sure you want to permanently delete coach "${deletingTrainerTarget.name}" from live website and database? This action will immediately remove the coach card live.`}
          type="danger"
          confirmText="DELETE COACH CARD NOW"
          cancelText="CANCEL"
          requireTextConfirm={true}
          onConfirm={executeDelete}
          onCancel={() => setDeletingTrainerTarget(null)}
        />
      )}
    </div>
  );
};
