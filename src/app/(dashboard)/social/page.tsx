'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { VirtualClass, generateMockClass, generateClassCode } from '@/lib/virtual-classes';
import { VirtualClassroom } from '@/components/social';

export default function SocialPage() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('');
  const [currentClass, setCurrentClass] = useState<VirtualClass | undefined>(undefined);

  useEffect(() => {
    const id = localStorage.getItem('activeProfileId');
    const name = localStorage.getItem('activeProfileName');
    if (id) setProfileId(id);
    if (name) setProfileName(name);
    
    const savedClass = localStorage.getItem(`class_${id}`);
    if (savedClass) {
      setCurrentClass(JSON.parse(savedClass));
    }
  }, []);

  const handleCreateClass = (name: string) => {
    if (!profileId || !profileName) return;
    
    const newClass = generateMockClass(profileId, profileName);
    newClass.name = name;
    setCurrentClass(newClass);
    localStorage.setItem(`class_${profileId}`, JSON.stringify(newClass));
  };

  const handleJoinClass = (code: string) => {
    if (!profileId || !profileName) return;
    
    const mockClass: VirtualClass = {
      id: `class_${code}`,
      name: 'Équipe des Champions',
      code,
      createdBy: 'other_user',
      createdAt: new Date(),
      members: [
        {
          id: profileId,
          name: profileName,
          avatar: '🦊',
          role: 'member',
          joinedAt: new Date(),
          weeklyXp: 0,
          totalXp: 0,
          currentStreak: 0,
          isOnline: true,
        }
      ],
      settings: {
        isPublic: false,
        maxMembers: 10,
        allowHints: true,
        showProgress: true,
      }
    };
    
    setCurrentClass(mockClass);
    localStorage.setItem(`class_${profileId}`, JSON.stringify(mockClass));
  };

  const handleLeaveClass = () => {
    if (profileId) {
      localStorage.removeItem(`class_${profileId}`);
      setCurrentClass(undefined);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mon Équipe</h1>
              <p className="text-gray-500">Apprends avec tes amis et relevez des défis ensemble !</p>
            </div>
          </div>
        </div>

        {/* Virtual Classroom */}
        <VirtualClassroom
          studentId={profileId || ''}
          studentName={profileName}
          currentClass={currentClass}
          onCreateClass={handleCreateClass}
          onJoinClass={handleJoinClass}
          onLeaveClass={handleLeaveClass}
        />
      </div>
    </div>
  );
}
