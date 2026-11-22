import React, { useState } from 'react';
import { ClassSchedule, User } from '../../types';
import { VelocityAPI } from '../../services/api';
import { Calendar, Plus, Edit2, Trash2, Clock, MapPin, UserCheck, X } from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Select } from '../../components/ui/Select';

interface ClassScheduleManagerProps {
  classes: ClassSchedule[];
  coaches: User[];
  clients?: User[];
  onClassesUpdated: () => void;
  onShowToast: (msg: string) => void;
}

export const ClassScheduleManager: React.FC<ClassScheduleManagerProps> = ({
  classes,
  coaches,
  clients = [],
  onClassesUpdated,
  onShowToast
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSchedule | null>(null);
  const [deletingClass, setDeletingClass] = useState<{ id: string; title: string } | null>(null);
  const [assigningClass, setAssigningClass] = useState<ClassSchedule | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'cycling' | 'strength' | 'mindbody' | 'boxing' | 'cardio'>('strength');
  const [trainerName, setTrainerName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>('Monday');
  const [startTime, setStartTime] = useState('07:00 AM');
  const [endTime, setEndTime] = useState('08:00 AM');
  const [room, setRoom] = useState('Studio A - Main Arena');
  const [maxCapacity, setMaxCapacity] = useState(20);
  const [price, setPrice] = useState(25);
  const [instructions, setInstructions] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');

  // Dynamic resolution of available coaches
  const availableCoachOptions = React.useMemo(() => {
    const list: string[] = [];
    if (coaches && coaches.length > 0) {
      list.push(...coaches.map((c) => c.name));
    }
    try {
      const allUsers = VelocityAPI.getUsers();
      if (Array.isArray(allUsers)) {
        const coachUsers = allUsers.filter((u) => u.role === 'coach' || u.role === 'headcoach');
        list.push(...coachUsers.map((c) => c.name));
      }
    } catch { }

    const defaults = ['Shaban Faridi', 'Moheeb Khan', 'Sadeem'];
    list.push(...defaults);

    return Array.from(new Set(list.map((n) => String(n).trim()).filter(Boolean)));
  }, [coaches]);

  const handleOpenCreate = () => {
    setEditingClass(null);
    setTitle('');
    setCategory('strength');
    setTrainerName(availableCoachOptions[0] || (coaches.length > 0 ? coaches[0].name : 'Shaban Faridi'));
    setDayOfWeek('Monday');
    setStartTime('07:00 AM');
    setEndTime('08:00 AM');
    setRoom('Studio A - Main Arena');
    setMaxCapacity(20);
    setPrice(25);
    setInstructions('');
    setAssignedToUserId('');
    setShowModal(true);
  };

  const handleOpenEdit = (cls: ClassSchedule) => {
    setEditingClass(cls);
    setTitle(cls.title);
    setCategory(cls.category);
    setTrainerName(cls.trainerName);
    setDayOfWeek(cls.dayOfWeek);
    setStartTime(cls.startTime);
    setEndTime(cls.endTime);
    setRoom(cls.room);
    setMaxCapacity(cls.maxCapacity);
    setPrice(cls.price);
    setInstructions(cls.instructions || '');
    setAssignedToUserId(cls.assignedToUserId || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !trainerName) {
      onShowToast('Title and Trainer are required.');
      return;
    }

    try {
      const assignedUser = clients.find(c => c.id === assignedToUserId);

      const savedClass = VelocityAPI.saveClass({
        id: editingClass ? editingClass.id : undefined,
        title,
        category,
        trainerName,
        dayOfWeek,
        startTime,
        endTime,
        room,
        maxCapacity: Number(maxCapacity),
        price: Number(price),
        instructions: instructions.trim(),
        assignedToUserId: assignedUser ? assignedUser.id : undefined,
        assignedToUserName: assignedUser ? assignedUser.name : undefined
      });

      // Automatically sync CoachAssignment
      VelocityAPI.saveCoachAssignment({
        id: `asgn-cls-${savedClass.id}`,
        assignmentType: 'class_schedule',
        referenceId: savedClass.id,
        title: `${savedClass.title} (${savedClass.category.toUpperCase()})`,
        description: `${savedClass.dayOfWeek} ${savedClass.startTime} - ${savedClass.endTime}`,
        instructions: instructions.trim() || `Lead session for registered clients. Verify attendance and studio setup.`,
        assignedCoachName: savedClass.trainerName,
        clientId: assignedUser?.id,
        clientName: assignedUser?.name || 'All Clients',
        clientEmail: assignedUser?.email,
        serviceName: `${savedClass.category.toUpperCase()} Class Session`,
        assignedByName: 'Shaban Faridi',
        assignedByRole: 'Head Coach',
        scheduleTime: `${savedClass.dayOfWeek}, ${savedClass.startTime}`,
        priority: 'medium',
        status: 'assigned',
        details: { room: savedClass.room, dayOfWeek: savedClass.dayOfWeek, startTime: savedClass.startTime, endTime: savedClass.endTime }
      });

      onShowToast(editingClass ? `Updated class "${title}"` : `Created & assigned class "${title}"`);
      setShowModal(false);
      onClassesUpdated();
    } catch (err: any) {
      onShowToast(err.message || 'Operation failed');
    }
  };

  const handleDeleteTrigger = (id: string, classTitle: string) => {
    setDeletingClass({ id, title: classTitle });
  };

  const confirmDelete = () => {
    if (deletingClass) {
      VelocityAPI.deleteClass(deletingClass.id);
      onShowToast(`Removed class "${deletingClass.title}"`);
      setDeletingClass(null);
      onClassesUpdated();
    }
  };

  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('All');

  const daysList = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const filteredClasses = selectedDayFilter === 'All'
    ? classes
    : classes.filter((c) => c.dayOfWeek.toLowerCase() === selectedDayFilter.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111111] border border-gray-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#8C532B]" />
            CLASS SCHEDULE MANAGER
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Edit class times, days of week, trainer assignments, and room locations for group sessions.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#8C532B] hover:bg-[#70401E] text-white text-xs font-black tracking-widest px-5 py-3 uppercase transition-all shadow-md shadow-amber-950/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ADD NEW CLASS SESSION</span>
        </button>
      </div>

      {/* Day Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-800">
        {daysList.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDayFilter(day)}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-all whitespace-nowrap border ${
              selectedDayFilter === day
                ? 'bg-[#8C532B] text-white border-[#8C532B]'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((cls) => (
          <div key={cls.id} className="bg-[#111111] border border-gray-800 p-5 relative flex flex-col justify-between hover:border-[#8C532B]/50 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-[#8C532B] text-white px-2 py-0.5">
                  {cls.category}
                </span>
              </div>

              <h3 className="text-lg font-black uppercase text-white mb-1">{cls.title}</h3>

              <div className="space-y-1 text-xs text-gray-400 mt-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#E52165]" />
                  <span>Day: <strong className="text-white">{cls.dayOfWeek}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-pink-400" />
                  <span>Time: <strong className="text-white">{cls.startTime} - {cls.endTime}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                  <span>Coach: <strong className="text-gray-200">{cls.trainerName}</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setAssigningClass(cls);
                  setSelectedClientId('');
                }}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 px-2.5 py-1 border border-emerald-800/60 flex items-center gap-1.5 transition-colors"
                title="Book/Assign Client Directly"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>BOOK CLIENT</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(cls)}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded"
                  title="Edit Class Details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTrigger(cls.id, cls.title)}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded"
                  title="Delete Class Session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md">
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-[#111111] text-white border-0 sm:border border-gray-800 p-4 sm:p-6 shadow-2xl overflow-y-auto flex flex-col rounded-none sm:rounded-xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase text-white mb-4">
              {editingClass ? `EDIT CLASS: ${editingClass.title}` : 'CREATE NEW CLASS SCHEDULE'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Class Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. HIIT Beast Burn"
                  className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 text-sm outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Category
                  </label>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-2 py-2 text-xs outline-none"
                  >
                    <option value="strength">Strength & Iron</option>
                    <option value="cardio">HIIT Cardio</option>
                    <option value="boxing">Pro Boxing</option>
                    <option value="cycling">Spin Cycling</option>
                    <option value="mindbody">Yoga & Recovery</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Assigned Coach
                  </label>
                  <Select
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 text-xs outline-none cursor-pointer font-bold"
                    required
                  >
                    {availableCoachOptions.map((cName) => (
                      <option key={cName} value={cName}>{cName}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Day
                  </label>
                  <Select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-2 py-2 text-xs outline-none"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-2 py-2 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-2 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#8C532B] hover:bg-[#70401E] text-white text-xs font-black tracking-widest py-3 uppercase mt-2"
              >
                {editingClass ? 'SAVE CHANGES' : 'CREATE CLASS SCHEDULE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Client Modal */}
      {assigningClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-[#111111] text-white border-0 sm:border border-emerald-500/60 p-4 sm:p-6 shadow-2xl space-y-4 overflow-y-auto flex flex-col rounded-none sm:rounded-xl">
            <button onClick={() => setAssigningClass(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                DIRECT CLASS BOOKING
              </span>
              <h3 className="text-lg font-black uppercase text-white">{assigningClass.title}</h3>
              <p className="text-xs text-gray-400">Trainer: {assigningClass.trainerName} | Slot: {assigningClass.dayOfWeek} ({assigningClass.startTime})</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Select Client/Person *</label>
              <Select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 text-white p-3 text-xs outline-none"
              >
                <option value="">-- Choose Client Profile --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </Select>
            </div>

            <button
              onClick={() => {
                if (!selectedClientId) {
                  onShowToast('Please select a client profile');
                  return;
                }
                try {
                  const booking = VelocityAPI.assignClientBooking(assigningClass.id, selectedClientId);
                  onShowToast(`Successfully booked client into "${assigningClass.title}" (Code: ${booking.bookingCode})!`);
                  setAssigningClass(null);
                  onClassesUpdated();
                } catch (err: any) {
                  onShowToast(err.message || 'Booking failed');
                }
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black tracking-widest py-3 uppercase shadow-md transition-all"
            >
              CONFIRM CLIENT BOOKING
            </button>
          </div>
        </div>
      )}

      {/* Dedicated Confirm Modal for Delete Class */}
      <ConfirmModal
        isOpen={!!deletingClass}
        title="DELETE CLASS SCHEDULE"
        message={`Are you sure you want to remove the class session "${deletingClass?.title}" from active classes?`}
        type="danger"
        confirmText="REMOVE CLASS"
        cancelText="KEEP CLASS"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingClass(null)}
      />
    </div>
  );
};
