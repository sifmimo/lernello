'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Trophy, Flame, Star, Copy, Check, Plus, 
  MessageCircle, Crown, Circle, ChevronRight, Target,
  Sparkles, Clock
} from 'lucide-react';
import { 
  VirtualClass, ClassMember, ClassChallenge, ClassActivity,
  generateMockMembers, generateMockActivities, generateMockChallenge,
  generateClassCode, formatRelativeTime
} from '@/lib/virtual-classes';

interface VirtualClassroomProps {
  studentId: string;
  studentName: string;
  currentClass?: VirtualClass;
  onCreateClass: (name: string) => void;
  onJoinClass: (code: string) => void;
  onLeaveClass: () => void;
}

export default function VirtualClassroom({
  studentId,
  studentName,
  currentClass,
  onCreateClass,
  onJoinClass,
  onLeaveClass
}: VirtualClassroomProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'activity' | 'challenge'>('members');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const mockMembers = currentClass ? [
    ...currentClass.members,
    ...generateMockMembers()
  ] : [];
  
  const mockActivities = currentClass ? generateMockActivities(currentClass.id) : [];
  const mockChallenge = currentClass ? generateMockChallenge(currentClass.id) : null;

  const handleCopyCode = () => {
    if (currentClass) {
      navigator.clipboard.writeText(currentClass.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  if (!currentClass) {
    return (
      <NoClassView
        onJoin={() => setShowJoinModal(true)}
        onCreate={() => setShowCreateModal(true)}
        showJoinModal={showJoinModal}
        showCreateModal={showCreateModal}
        joinCode={joinCode}
        newClassName={newClassName}
        onJoinCodeChange={setJoinCode}
        onClassNameChange={setNewClassName}
        onCloseJoinModal={() => setShowJoinModal(false)}
        onCloseCreateModal={() => setShowCreateModal(false)}
        onSubmitJoin={() => {
          onJoinClass(joinCode);
          setShowJoinModal(false);
          setJoinCode('');
        }}
        onSubmitCreate={() => {
          onCreateClass(newClassName);
          setShowCreateModal(false);
          setNewClassName('');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Class Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{currentClass.name}</h2>
            <p className="text-white/80">{mockMembers.length} membres</p>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
          >
            {codeCopied ? (
              <>
                <Check className="h-4 w-4" />
                <span className="font-mono font-bold">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className="font-mono font-bold">{currentClass.code}</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{mockMembers.filter(m => m.isOnline).length}</p>
            <p className="text-xs text-white/70">En ligne</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{mockMembers.reduce((sum, m) => sum + m.weeklyXp, 0)}</p>
            <p className="text-xs text-white/70">XP cette semaine</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{Math.max(...mockMembers.map(m => m.currentStreak))}</p>
            <p className="text-xs text-white/70">Meilleure série</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        {(['members', 'activity', 'challenge'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'members' && 'Membres'}
            {tab === 'activity' && 'Activité'}
            {tab === 'challenge' && 'Défi'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'members' && (
          <MembersTab key="members" members={mockMembers} currentUserId={studentId} />
        )}
        {activeTab === 'activity' && (
          <ActivityTab key="activity" activities={mockActivities} />
        )}
        {activeTab === 'challenge' && mockChallenge && (
          <ChallengeTab key="challenge" challenge={mockChallenge} members={mockMembers} />
        )}
      </AnimatePresence>
    </div>
  );
}

function NoClassView({
  onJoin,
  onCreate,
  showJoinModal,
  showCreateModal,
  joinCode,
  newClassName,
  onJoinCodeChange,
  onClassNameChange,
  onCloseJoinModal,
  onCloseCreateModal,
  onSubmitJoin,
  onSubmitCreate
}: {
  onJoin: () => void;
  onCreate: () => void;
  showJoinModal: boolean;
  showCreateModal: boolean;
  joinCode: string;
  newClassName: string;
  onJoinCodeChange: (v: string) => void;
  onClassNameChange: (v: string) => void;
  onCloseJoinModal: () => void;
  onCloseCreateModal: () => void;
  onSubmitJoin: () => void;
  onSubmitCreate: () => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
        <Users className="h-10 w-10 text-indigo-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Rejoins une équipe !</h2>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        Apprends avec tes amis, partage tes progrès et relevez des défis ensemble !
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onJoin}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <Users className="h-5 w-5" />
          Rejoindre une équipe
        </button>
        <button
          onClick={onCreate}
          className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Créer une équipe
        </button>
      </div>

      {/* Join Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <Modal onClose={onCloseJoinModal}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Rejoindre une équipe</h3>
            <p className="text-gray-500 mb-4">Entre le code de l'équipe que tu veux rejoindre</p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => onJoinCodeChange(e.target.value.toUpperCase())}
              placeholder="CODE123"
              maxLength={6}
              className="w-full px-4 py-3 text-center text-2xl font-mono font-bold border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none mb-4"
            />
            <button
              onClick={onSubmitJoin}
              disabled={joinCode.length < 6}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rejoindre
            </button>
          </Modal>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <Modal onClose={onCloseCreateModal}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Créer une équipe</h3>
            <p className="text-gray-500 mb-4">Donne un nom à ton équipe</p>
            <input
              type="text"
              value={newClassName}
              onChange={(e) => onClassNameChange(e.target.value)}
              placeholder="Les Champions"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none mb-4"
            />
            <button
              onClick={onSubmitCreate}
              disabled={newClassName.length < 3}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Créer l'équipe
            </button>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function MembersTab({ members, currentUserId }: { members: ClassMember[]; currentUserId: string }) {
  const sortedMembers = [...members].sort((a, b) => b.weeklyXp - a.weeklyXp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3"
    >
      {sortedMembers.map((member, idx) => (
        <div
          key={member.id}
          className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${
            member.id === currentUserId ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-white border border-gray-100'
          }`}
        >
          <div className="relative">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
              idx === 0 ? 'bg-amber-100' : idx === 1 ? 'bg-gray-100' : idx === 2 ? 'bg-orange-100' : 'bg-gray-50'
            }`}>
              {member.avatar}
            </div>
            {member.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            )}
            {member.role === 'leader' && (
              <div className="absolute -top-1 -right-1">
                <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 truncate">{member.name}</p>
              {member.id === currentUserId && (
                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">Toi</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                {member.currentStreak}j
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                {member.totalXp} XP
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="font-bold text-indigo-600">+{member.weeklyXp}</p>
            <p className="text-xs text-gray-400">cette semaine</p>
          </div>

          {idx < 3 && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-gray-300 text-gray-700' : 'bg-orange-300 text-white'
            }`}>
              {idx + 1}
            </div>
          )}
        </div>
      ))}
    </motion.div>
  );
}

function ActivityTab({ activities }: { activities: ClassActivity[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3"
    >
      {activities.map(activity => (
        <div key={activity.id} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            {activity.type === 'streak' && <Flame className="h-5 w-5 text-orange-500" />}
            {activity.type === 'achievement' && <Trophy className="h-5 w-5 text-amber-500" />}
            {activity.type === 'level_up' && <Star className="h-5 w-5 text-indigo-500" />}
            {activity.type === 'challenge_contribution' && <Target className="h-5 w-5 text-green-500" />}
            {activity.type === 'joined' && <Users className="h-5 w-5 text-blue-500" />}
          </div>
          <div className="flex-1">
            <p className="text-gray-700">
              <span className="font-semibold">{activity.memberName}</span> {activity.message}
            </p>
            <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(activity.timestamp)}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function ChallengeTab({ challenge, members }: { challenge: ClassChallenge; members: ClassMember[] }) {
  const progress = (challenge.currentXp / challenge.targetXp) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5" />
          <h3 className="font-bold">{challenge.title}</h3>
        </div>
        <p className="text-white/80 text-sm mb-4">{challenge.description}</p>

        <div className="bg-white/20 rounded-full h-4 mb-2">
          <div
            className="bg-white rounded-full h-4 transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span>{challenge.currentXp} / {challenge.targetXp} XP</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <h4 className="font-semibold text-gray-900 mb-3">Contributions</h4>
        <div className="space-y-2">
          {challenge.contributors
            .sort((a, b) => b.xp - a.xp)
            .map(contrib => {
              const member = members.find(m => m.id === contrib.memberId);
              if (!member) return null;
              return (
                <div key={contrib.memberId} className="flex items-center gap-3">
                  <span className="text-xl">{member.avatar}</span>
                  <span className="flex-1 font-medium text-gray-700">{member.name}</span>
                  <span className="font-bold text-indigo-600">+{contrib.xp} XP</span>
                </div>
              );
            })}
        </div>
      </div>
    </motion.div>
  );
}
