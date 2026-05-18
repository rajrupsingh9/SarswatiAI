
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, BookOpen, Trash2, Upload, CheckCircle2, ChevronRight, ChevronLeft, LayoutGrid, List, ChevronUp, ChevronDown, Edit3, BarChart3, Bell, Users, TrendingUp, Calendar, Send, Search, Sparkles, Info } from 'lucide-react';
import { ClassData, Subject, Chapter, TextLayer, TestSubmission, FocusGoal } from '../types/academic';
import { getPdfPages, getFileAsImage } from '../lib/pdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import TestBuilder from './TestBuilder';
import { TeacherManual } from './UserManual';

type DashboardTab = 'curriculum' | 'analytics' | 'announcements' | 'exams' | 'help';

interface TeacherDashboardProps {
  data: ClassData[];
  onUpdateData: (newData: ClassData[]) => void;
  onExit: () => void;
  onLogout: () => void;
  onSwitchToStudent: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ data, onUpdateData, onExit, onLogout, onSwitchToStudent }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('curriculum');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'standard' | 'ledger'>('ledger');
  const [searchQuery, setSearchQuery] = useState("");
  const [curriculumFilter, setCurriculumFilter] = useState<'ALL' | FocusGoal>('ALL');
  const [isUploading, setIsUploading] = useState(false);

  // Status for adding new items
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterName, setNewChapterName] = useState("");
  const [newChapterFocus, setNewChapterFocus] = useState<FocusGoal>('BOARDS');

  const [isAddingTopic, setIsAddingTopic] = useState<string | null>(null);
  const [newTopicFocus, setNewTopicFocus] = useState<FocusGoal>('BOARDS');
  const [isAddingDPP, setIsAddingDPP] = useState<string | null>(null);
  const [isAddingExercise, setIsAddingExercise] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState("");

  const [editingSubject, setEditingSubject] = useState<{ classId: string, id: string, name: string } | null>(null);
  const [editingChapter, setEditingChapter] = useState<{ classId: string, subjectId: string, id: string, name: string, focus: FocusGoal } | null>(null);
  const [editingTopic, setEditingTopic] = useState<{ classId: string, subjectId: string, chapterId: string, id: string, name: string, focus: FocusGoal } | null>(null);
  const [editingClass, setEditingClass] = useState<{ id: string, name: string } | null>(null);
  const [isEditingObjectives, setIsEditingObjectives] = useState<{ classId: string, subjectId: string, chapterId: string, topicId: string, name: string, objectives: string[] } | null>(null);
  const [tempObjectives, setTempObjectives] = useState("");

  const [announcementText, setAnnouncementText] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [editingTest, setEditingTest] = useState<any | null>(null);
  const [viewingTestSubmissions, setViewingTestSubmissions] = useState<string | null>(null);
  const [testSubmissions, setTestSubmissions] = useState<TestSubmission[]>([]);

  // Sync announcements, tests, and student submissions
  useEffect(() => {
    const qAnn = query(collection(db, 'announcements'), orderBy('date', 'desc'));
    const unsubAnn = onSnapshot(qAnn, (snapshot) => {
      const anns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(anns);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'announcements'));

    const qTests = query(collection(db, 'tests'), orderBy('createdAt', 'desc'));
    const unsubTests = onSnapshot(qTests, (snapshot) => {
      const ts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTests(ts);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tests'));

    if (viewingTestSubmissions) {
      const qSubs = query(
        collection(db, 'submissions'),
        where('testId', '==', viewingTestSubmissions)
      );
      const unsubSubs = onSnapshot(qSubs, (snapshot) => {
        const subs = snapshot.docs.map(doc => doc.data() as TestSubmission);
        setTestSubmissions(subs);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'submissions'));
      return () => {
        unsubAnn();
        unsubTests();
        unsubSubs();
      };
    }

    return () => {
      unsubAnn();
      unsubTests();
    };
  }, [viewingTestSubmissions]);

  // Mock student data for analytics
  const studentStats = [
    { name: 'John Doe', studyTime: 120, score: 85, lastTopic: 'Force & Motion' },
    { name: 'Alice Smith', studyTime: 95, score: 92, lastTopic: 'Thermodynamics' },
    { name: 'Bob Wilson', studyTime: 45, score: 68, lastTopic: 'Optics' },
    { name: 'Emma Brown', studyTime: 150, score: 95, lastTopic: 'Electromagnetism' },
    { name: 'Chris Evans', studyTime: 30, score: 45, lastTopic: 'Quantum Mechanics' },
  ];

  const overallProgressData = [
    { day: 'Mon', active: 45, avgScore: 78 },
    { day: 'Tue', active: 52, avgScore: 82 },
    { day: 'Wed', active: 38, avgScore: 75 },
    { day: 'Thu', active: 65, avgScore: 88 },
    { day: 'Fri', active: 48, avgScore: 80 },
    { day: 'Sat', active: 20, avgScore: 85 },
    { day: 'Sun', active: 15, avgScore: 82 },
  ];

  const handleSendAnnouncement = async () => {
    if (!announcementText.trim()) return;
    
    const newAnn = {
      text: announcementText.trim(),
      date: new Date().toISOString(),
      target: selectedClassId ? data.find(c => c.id === selectedClassId)?.name : "All Students",
      type: "NEURAL_BROADCAST",
      sender: "Academic Studio"
    };

    try {
      const annRef = collection(db, 'announcements');
      await addDoc(annRef, newAnn)
        .catch(err => handleFirestoreError(err, OperationType.CREATE, annRef.path));
      setAnnouncementText("");
    } catch (error) {
      console.error("Failed to send broadcast:", error);
      alert("Neural Broadcast Interrupted. Try again.");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const annDocRef = doc(db, 'announcements', id);
      await deleteDoc(annDocRef)
        .catch(err => handleFirestoreError(err, OperationType.DELETE, annDocRef.path));
    } catch (error) {
      console.error("Failed to delete broadcast:", error);
    }
  };

  const handleCreateClass = () => {
    if (!newClassName.trim()) return;
    const newClass: ClassData = {
      id: 'class-' + Date.now(),
      name: newClassName.trim(),
      subjects: []
    };
    onUpdateData([...data, newClass]);
    setNewClassName("");
    setIsAddingClass(false);
    setSelectedClassId(newClass.id);
  };

  const handleCreateSubject = () => {
    if (!newSubjectName.trim() || !selectedClassId) return;
    const newData = data.map(c => {
      if (c.id === selectedClassId) {
        return {
          ...c,
          subjects: [...c.subjects, { id: 'sub-' + Date.now(), name: newSubjectName.trim(), chapters: [] }]
        };
      }
      return c;
    });
    onUpdateData(newData);
    setNewSubjectName("");
    setIsAddingSubject(false);
  };

  const handleCreateChapter = () => {
    if (!newChapterName.trim() || !selectedClassId || !selectedSubjectId) return;
    
    const newChapter: Chapter = {
      id: 'ch-' + Date.now(),
      name: newChapterName.trim(),
      focus: newChapterFocus,
      topics: []
    };

    const newData = data.map(c => {
      if (c.id === selectedClassId) {
        return {
          ...c,
          subjects: c.subjects.map(s => {
            if (s.id === selectedSubjectId) {
              return { ...s, chapters: [...s.chapters, newChapter] };
            }
            return s;
          })
        };
      }
      return c;
    });

    onUpdateData(newData);
    setNewChapterName("");
    setIsAddingChapter(false);
  };

  const processFiles = async (files: FileList) => {
    const allPages: string[] = [];
    const allTextLayers: TextLayer[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        if (file.type === 'application/pdf') {
          const { pages: pdfPages, textLayers } = await getPdfPages(file);
          allPages.push(...pdfPages);
          allTextLayers.push(...textLayers);
        } else if (file.type.startsWith('image/')) {
          const img = await getFileAsImage(file);
          allPages.push(img);
          allTextLayers.push({ items: [] });
        }
      } catch (fileErr) {
        console.error(`Error processing file ${file.name}:`, fileErr);
      }
    }
    return { allPages, allTextLayers };
  };

  const handleTopicUpload = async (classId: string, subjectId: string, chapterId: string, files: FileList) => {
    if (!newTopicName.trim()) {
      alert("Please enter a topic name first.");
      return;
    }

    setIsUploading(true);
    try {
      const { allPages, allTextLayers } = await processFiles(files);

      if (allPages.length === 0) {
        throw new Error("No valid pages could be extracted from your files.");
      }

      const newTopic: any = {
        id: 'tp-' + Date.now(),
        name: newTopicName.trim(),
        focus: newTopicFocus,
        pages: allPages,
        textLayers: allTextLayers
      };

      const newData = data.map(c => {
        if (c.id === classId) {
          return {
            ...c,
            subjects: c.subjects.map(s => {
              if (s.id === subjectId) {
                return {
                  ...s,
                  chapters: s.chapters.map(ch => {
                    if (ch.id === chapterId) {
                      return { ...ch, topics: [...(ch.topics || []), newTopic] };
                    }
                    return ch;
                  })
                };
              }
              return s;
            })
          };
        }
        return c;
      });

      onUpdateData(newData);
      setNewTopicName("");
      setIsAddingTopic(null);
      alert(`Success! Topic "${newTopic.name}" added.`);
    } catch (err: any) {
      alert("Topic upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleContentUpload = async (classId: string, subjectId: string, chapterId: string, topicId: string, type: 'solvedExamples' | 'unsolvedExercises', files: FileList) => {
    setIsUploading(true);
    try {
      const { allPages, allTextLayers } = await processFiles(files);
      if (allPages.length === 0) throw new Error("No valid pages extracted.");

      const newData = data.map(c => {
        if (c.id === classId) {
          return {
            ...c,
            subjects: c.subjects.map(s => {
              if (s.id === subjectId) {
                return {
                  ...s,
                  chapters: s.chapters.map(ch => {
                    if (ch.id === chapterId) {
                      return {
                        ...ch,
                        topics: ch.topics.map(t => {
                          if (t.id === topicId) {
                            return {
                              ...t,
                              [type]: {
                                id: type + '-' + Date.now(),
                                name: (type === 'solvedExamples' ? 'Examples: ' : 'Exercises: ') + t.name,
                                pages: allPages,
                                textLayers: allTextLayers
                              }
                            };
                          }
                          return t;
                        })
                      };
                    }
                    return ch;
                  })
                };
              }
              return s;
            })
          };
        }
        return c;
      });

      onUpdateData(newData);
      alert(`${type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} uploaded successfully!`);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDPPUpload = async (classId: string, subjectId: string, chapterId: string, topicId: string, files: FileList) => {
    setIsUploading(true);
    try {
      const { allPages, allTextLayers } = await processFiles(files);
      if (allPages.length === 0) throw new Error("No valid pages extracted.");

      const newData = data.map(c => {
        if (c.id === classId) {
          return {
            ...c,
            subjects: c.subjects.map(s => {
              if (s.id === subjectId) {
                return {
                  ...s,
                  chapters: s.chapters.map(ch => {
                    if (ch.id === chapterId) {
                      return {
                        ...ch,
                        topics: ch.topics.map(t => {
                          if (t.id === topicId) {
                            return {
                              ...t,
                              dpp: {
                                id: 'dpp-' + Date.now(),
                                name: "DPP: " + t.name,
                                pages: allPages,
                                textLayers: allTextLayers
                              }
                            };
                          }
                          return t;
                        })
                      };
                    }
                    return ch;
                  })
                };
              }
              return s;
            })
          };
        }
        return c;
      });

      onUpdateData(newData);
      setIsAddingDPP(null);
      alert("DPP uploaded successfully!");
    } catch (err: any) {
      alert("DPP upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExerciseUpload = async (classId: string, subjectId: string, chapterId: string, files: FileList) => {
    setIsUploading(true);
    try {
      const { allPages, allTextLayers } = await processFiles(files);
      if (allPages.length === 0) throw new Error("No valid pages extracted.");

      const newData = data.map(c => {
        if (c.id === classId) {
          return {
            ...c,
            subjects: c.subjects.map(s => {
              if (s.id === subjectId) {
                return {
                  ...s,
                  chapters: s.chapters.map(ch => {
                    if (ch.id === chapterId) {
                      return {
                        ...ch,
                        exercise: {
                          id: 'ex-' + Date.now(),
                          name: "Exercise: " + ch.name,
                          pages: allPages,
                          textLayers: allTextLayers
                        }
                      };
                    }
                    return ch;
                  })
                };
              }
              return s;
            })
          };
        }
        return c;
      });

      onUpdateData(newData);
      setIsAddingExercise(null);
      alert("Chapter Exercise uploaded successfully!");
    } catch (err: any) {
      alert("Exercise upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteSubject = (classId: string, subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject? All chapters and topics inside will be lost.")) return;
    const newData = data.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          subjects: c.subjects.filter(s => s.id !== subjectId)
        };
      }
      return c;
    });
    onUpdateData(newData);
    if (selectedSubjectId === subjectId) setSelectedSubjectId(null);
  };

  const editSubject = (classId: string, subjectId: string, oldName: string) => {
    setEditingSubject({ classId, id: subjectId, name: oldName });
  };

  const handleUpdateSubject = () => {
    if (!editingSubject || !editingSubject.name.trim()) return;
    const newData = data.map(c => {
      if (c.id === editingSubject.classId) {
        return {
          ...c,
          subjects: c.subjects.map(s => s.id === editingSubject.id ? { ...s, name: editingSubject.name.trim() } : s)
        };
      }
      return c;
    });
    onUpdateData(newData);
    setEditingSubject(null);
  };

  const editChapter = (classId: string, subjectId: string, chapterId: string, oldName: string) => {
    const classToEdit = data.find(c => c.id === classId);
    if (!classToEdit) return;
    const subjectToEdit = classToEdit.subjects.find(s => s.id === subjectId);
    if (!subjectToEdit) return;
    const chapterToEdit = subjectToEdit.chapters.find(ch => ch.id === chapterId);
    if (!chapterToEdit) return;
    
    setEditingChapter({ 
      classId, 
      subjectId, 
      id: chapterId, 
      name: oldName, 
      focus: chapterToEdit.focus || 'BOARDS' 
    });
  };

  const handleUpdateChapter = () => {
    if (!editingChapter || !editingChapter.name.trim()) return;
    const newData = data.map(c => {
      if (c.id === editingChapter.classId) {
        return {
          ...c,
          subjects: c.subjects.map(s => {
            if (s.id === editingChapter.subjectId) {
              return {
                ...s,
                chapters: s.chapters.map(ch => ch.id === editingChapter.id ? { 
                  ...ch, 
                  name: editingChapter.name.trim(),
                  focus: editingChapter.focus
                } : ch)
              };
            }
            return s;
          })
        };
      }
      return c;
    });
    onUpdateData(newData);
    setEditingChapter(null);
  };

  const editTopic = (classId: string, subjectId: string, chapterId: string, topicId: string, oldName: string) => {
    const classToEdit = data.find(c => c.id === classId);
    if (!classToEdit) return;
    const subjectToEdit = classToEdit.subjects.find(s => s.id === subjectId);
    if (!subjectToEdit) return;
    const chapterToEdit = subjectToEdit.chapters.find(ch => ch.id === chapterId);
    if (!chapterToEdit) return;
    const topicToEdit = chapterToEdit.topics.find(t => t.id === topicId);
    if (!topicToEdit) return;

    setEditingTopic({ 
      classId, 
      subjectId, 
      chapterId, 
      id: topicId, 
      name: oldName,
      focus: topicToEdit.focus || 'BOARDS'
    });
  };

  const handleUpdateTopic = () => {
    if (!editingTopic || !editingTopic.name.trim()) return;
    const newData = data.map(c => {
      if (c.id === editingTopic.classId) {
        return {
          ...c,
          subjects: c.subjects.map(s => {
            if (s.id === editingTopic.subjectId) {
              return {
                ...s,
                chapters: s.chapters.map(ch => {
                  if (ch.id === editingTopic.chapterId) {
                    return {
                      ...ch,
                      topics: ch.topics.map(t => t.id === editingTopic.id ? { 
                        ...t, 
                        name: editingTopic.name.trim(),
                        focus: editingTopic.focus
                      } : t)
                    };
                  }
                  return ch;
                })
              };
            }
            return s;
          })
        };
      }
      return c;
    });
    onUpdateData(newData);
    setEditingTopic(null);
  };

  const editClass = (classId: string, oldName: string) => {
    setEditingClass({ id: classId, name: oldName });
  };

  const handleUpdateClass = () => {
    if (!editingClass || !editingClass.name.trim()) return;
    const newData = data.map(c => {
      if (c.id === editingClass.id) {
        return { ...c, name: editingClass.name.trim() };
      }
      return c;
    });
    onUpdateData(newData);
    setEditingClass(null);
  };

  const deleteClass = (classId: string) => {
    if (!confirm("Are you sure you want to delete this class and all its intelligence data?")) return;
    const newData = data.filter(c => c.id !== classId);
    onUpdateData(newData);
    if (selectedClassId === classId) setSelectedClassId(null);
  };

  const deleteContent = (classId: string, subjectId: string, chapterId: string, topicId: string, type: 'solvedExamples' | 'unsolvedExercises') => {
    if (!confirm(`Are you sure you want to delete this ${type.replace(/([A-Z])/g, ' $1')}?`)) return;
    const newData = data.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          subjects: c.subjects.map(s => {
            if (s.id === subjectId) {
              return {
                ...s,
                chapters: s.chapters.map(ch => {
                  if (ch.id === chapterId) {
                    return {
                      ...ch,
                      topics: ch.topics.map(t => {
                        if (t.id === topicId) {
                          const updatedTopic = { ...t };
                          delete updatedTopic[type];
                          return updatedTopic;
                        }
                        return t;
                      })
                    };
                  }
                  return ch;
                })
              };
            }
            return s;
          })
        };
      }
      return c;
    });
    onUpdateData(newData);
  };

  const deleteDPP = (classId: string, subjectId: string, chapterId: string, topicId: string) => {
    if (!confirm("Are you sure you want to delete this DPP?")) return;
    const newData = data.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          subjects: c.subjects.map(s => {
            if (s.id === subjectId) {
              return {
                ...s,
                chapters: s.chapters.map(ch => {
                  if (ch.id === chapterId) {
                    return {
                      ...ch,
                      topics: ch.topics.map(t => {
                        if (t.id === topicId) {
                          const { dpp, ...rest } = t;
                          return rest;
                        }
                        return t;
                      })
                    };
                  }
                  return ch;
                })
              };
            }
            return s;
          })
        };
      }
      return c;
    });
    onUpdateData(newData);
  };

  const deleteExercise = (classId: string, subjectId: string, chapterId: string) => {
    if (!confirm("Are you sure you want to delete this Chapter Exercise?")) return;
    const newData = data.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          subjects: c.subjects.map(s => {
            if (s.id === subjectId) {
              return {
                ...s,
                chapters: s.chapters.map(ch => {
                  if (ch.id === chapterId) {
                    const { exercise, ...rest } = ch;
                    return rest;
                  }
                  return ch;
                })
              };
            }
            return s;
          })
        };
      }
      return c;
    });
    onUpdateData(newData);
  };
  const deleteTopic = (classId: string, subjectId: string, chapterId: string, topicId: string) => {
    if (!confirm("Are you sure you want to delete this topic?")) return;
    const newData = data.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          subjects: c.subjects.map(s => {
            if (s.id === subjectId) {
              return {
                ...s,
                chapters: s.chapters.map(ch => {
                  if (ch.id === chapterId) {
                    return { ...ch, topics: ch.topics.filter(t => t.id !== topicId) };
                  }
                  return ch;
                })
              };
            }
            return s;
          })
        };
      }
      return c;
    });
    onUpdateData(newData);
  };

  const handleUpdateObjectives = () => {
    if (!isEditingObjectives) return;
    
    // Split by newline and filter empty
    const objectivesList = tempObjectives.split('\n').map(o => o.trim()).filter(o => o !== "");
    
    const newData = data.map(c => {
      if (c.id === isEditingObjectives.classId) {
        return {
          ...c,
          subjects: c.subjects.map(s => {
            if (s.id === isEditingObjectives.subjectId) {
              return {
                ...s,
                chapters: s.chapters.map(ch => {
                  if (ch.id === isEditingObjectives.chapterId) {
                    return {
                      ...ch,
                      topics: ch.topics.map(t => {
                        if (t.id === isEditingObjectives.topicId) {
                          return { ...t, learningObjectives: objectivesList };
                        }
                        return t;
                      })
                    };
                  }
                  return ch;
                })
              };
            }
            return s;
          })
        };
      }
      return c;
    });

    onUpdateData(newData);
    setIsEditingObjectives(null);
    setTempObjectives("");
  };

  const deleteChapter = (classId: string, subjectId: string, chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return;
    const newData = data.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          subjects: c.subjects.map(s => {
            if (s.id === subjectId) {
              return { ...s, chapters: s.chapters.filter(ch => ch.id !== chapterId) };
            }
            return s;
          })
        };
      }
      return c;
    });
    onUpdateData(newData);
  };

  const moveChapter = (classId: string, subjectId: string, chapterId: string, direction: 'up' | 'down') => {
    const newData = data.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          subjects: c.subjects.map(s => {
            if (s.id === subjectId) {
              const index = s.chapters.findIndex(ch => ch.id === chapterId);
              if (index === -1) return s;
              
              const newChapters = [...s.chapters];
              const targetIndex = direction === 'up' ? index - 1 : index + 1;
              
              if (targetIndex >= 0 && targetIndex < newChapters.length) {
                [newChapters[index], newChapters[targetIndex]] = [newChapters[targetIndex], newChapters[index]];
              }
              
              return { ...s, chapters: newChapters };
            }
            return s;
          })
        };
      }
      return c;
    });
    onUpdateData(newData);
  };

  const selectedClass = data.find(c => c.id === selectedClassId);
  const selectedSubject = selectedClass?.subjects.find(s => s.id === selectedSubjectId);

  const MasterCurriculumLedger = () => {
    if (!selectedClass) return null;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Ledger Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div>
            <h2 className="text-3xl font-display font-black tracking-tighter">Academic Ledger: {selectedClass.name}</h2>
            <p className="text-slate-500 text-sm font-medium">Manage and audit the entire curriculum across all battlefields.</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsAddingSubject(true)}
                className="flex items-center gap-2 px-6 py-3 bg-nyra-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-nyra-primary/20 hover:bg-nyra-primary/90 transition-all"
             >
                <Plus size={16} /> Add Subject
             </button>
             <button onClick={() => setSelectedClassId(null)} className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-500 hover:text-white transition-all">
                <ChevronLeft size={20} />
             </button>
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
            {(['ALL', 'FOUNDATION', 'BOARDS', 'JEE', 'UNIVERSAL'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setCurriculumFilter(filter)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  curriculumFilter === filter ? 'bg-nyra-primary text-white shadow-lg shadow-nyra-primary/20' : 'text-slate-500 hover:text-white'
                }`}
              >
                {filter === 'ALL' ? 'Everything' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects, chapters, or topics..."
              className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm focus:border-nyra-primary outline-none transition-all"
            />
          </div>
          <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-nyra-primary/10 rounded-xl flex items-center justify-center text-nyra-primary">
              <BookOpen size={18} />
            </div>
            <div>
              <div className="text-xs font-black text-slate-500 uppercase">Subjects</div>
              <div className="text-lg font-black leading-none">{selectedClass.subjects.length}</div>
            </div>
          </div>
          <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-xs font-black text-slate-500 uppercase">Materials</div>
              <div className="text-lg font-black leading-none">
                {selectedClass.subjects.reduce((acc, s) => acc + s.chapters.reduce((accCh, ch) => accCh + ch.topics.length, 0), 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Matrix */}
        <div className="space-y-6">
          {selectedClass.subjects.map((sub) => (
            <div key={sub.id} className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden group/sub">
              <div className="p-6 bg-slate-950/50 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-nyra-primary group-hover/sub:scale-110 transition-transform">
                    <LayoutGrid size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">{sub.name}</h3>
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{sub.chapters.length} Folders Attached</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                        setSelectedSubjectId(sub.id);
                        setIsAddingChapter(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-nyra-primary/10 text-nyra-primary border border-nyra-primary/20 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-nyra-primary hover:text-white transition-all"
                  >
                    <Plus size={12} /> Add Folder
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => editSubject(selectedClass.id, sub.id, sub.name)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><Edit3 size={16} /></button>
                    <button onClick={() => deleteSubject(selectedClass.id, sub.id)} className="p-2 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {sub.chapters.length === 0 ? (
                  <div className="py-12 text-center text-slate-600 border-2 border-dashed border-white/5 rounded-3xl italic text-sm">
                    No folders in this subject. Click "Add Subject" or select subject to manage.
                  </div>
                ) : (
                  sub.chapters
                    .filter(ch => (curriculumFilter === 'ALL' || ch.focus === curriculumFilter || ch.focus === 'UNIVERSAL'))
                    .filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((ch) => (
                      <div key={ch.id} className="group bg-slate-950/30 border border-white/5 rounded-3xl overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-white/5 bg-slate-950/20">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              ch.focus === 'JEE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                              ch.focus === 'BOARDS' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                              ch.focus === 'UNIVERSAL' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                              'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}>{ch.focus}</span>
                            <h4 className="font-bold text-slate-200">{ch.name}</h4>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                                onClick={() => {
                                    setSelectedSubjectId(sub.id);
                                    setIsAddingTopic(ch.id);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                            >
                                <Plus size={10} /> Add Material
                            </button>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => editChapter(selectedClass.id, sub.id, ch.id, ch.name)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white"><Edit3 size={14} /></button>
                               <button onClick={() => deleteChapter(selectedClass.id, sub.id, ch.id)} className="p-1.5 hover:bg-rose-500/20 rounded-lg text-slate-500 hover:text-rose-500"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        </div>

                        <div className="p-2 divide-y divide-white/5">
                          {ch.topics.length === 0 ? (
                            <div className="p-4 text-[10px] uppercase text-slate-600 font-bold text-center">Empty Matrix</div>
                          ) : (
                            ch.topics
                              .filter(t => (curriculumFilter === 'ALL' || t.focus === curriculumFilter || t.focus === 'UNIVERSAL'))
                              .map((t) => (
                                <div key={t.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-nyra-primary/10 flex items-center justify-center text-nyra-primary font-black text-[10px]">T</div>
                                    <div>
                                      <div className="text-sm font-bold">{t.name}</div>
                                      <div className="text-[10px] text-slate-500 uppercase tracking-widest">{t.pages.length} Neural Layers</div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3">
                                    <button 
                                      onClick={() => {
                                        setTempObjectives((t.learningObjectives || []).join('\n'));
                                        setIsEditingObjectives({
                                          classId: selectedClass.id,
                                          subjectId: sub.id,
                                          chapterId: ch.id,
                                          topicId: t.id,
                                          name: t.name,
                                          objectives: t.learningObjectives || []
                                        });
                                      }}
                                      className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                        t.learningObjectives && t.learningObjectives.length > 0 
                                          ? 'bg-nyra-primary/10 border-nyra-primary/30 text-nyra-primary hover:bg-nyra-primary hover:text-white' 
                                          : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                                      }`}
                                    >
                                      <List size={10} /> {t.learningObjectives && t.learningObjectives.length > 0 ? 'Objectives: Set' : '+ Objectives'}
                                    </button>

                                    {/* DPP Toggle */}
                                    <div className="relative group/btn">
                                      {t.dpp ? (
                                        <button 
                                          onClick={() => deleteDPP(selectedClass.id, sub.id, ch.id, t.id)}
                                          className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[9px] font-black text-amber-500 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-500 transition-all uppercase tracking-widest"
                                        >
                                          DPP: Active <Trash2 size={10} />
                                        </button>
                                      ) : (
                                        <div className="relative">
                                          <input 
                                            type="file" multiple accept=".pdf,image/*" 
                                            onChange={(e) => e.target.files && handleDPPUpload(selectedClass.id, sub.id, ch.id, t.id, e.target.files)}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                          />
                                          <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest">
                                            <Upload size={10} /> + DPP
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Examples Toggle */}
                                    <div className="relative group/btn">
                                      {t.solvedExamples ? (
                                        <button 
                                          onClick={() => deleteContent(selectedClass.id, sub.id, ch.id, t.id, 'solvedExamples')}
                                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[9px] font-black text-blue-500 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-500 transition-all uppercase tracking-widest"
                                        >
                                          SOLVED: OK <Trash2 size={10} />
                                        </button>
                                      ) : (
                                        <div className="relative">
                                          <input 
                                            type="file" multiple accept=".pdf,image/*" 
                                            onChange={(e) => e.target.files && handleContentUpload(selectedClass.id, sub.id, ch.id, t.id, 'solvedExamples', e.target.files)}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                          />
                                          <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest">
                                            <Upload size={10} /> + Solved
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Unsolved Toggle */}
                                    <div className="relative group/btn">
                                      {t.unsolvedExercises ? (
                                        <button 
                                          onClick={() => deleteContent(selectedClass.id, sub.id, ch.id, t.id, 'unsolvedExercises')}
                                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[9px] font-black text-emerald-500 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-500 transition-all uppercase tracking-widest"
                                        >
                                          PRACTICE: OK <Trash2 size={10} />
                                        </button>
                                      ) : (
                                        <div className="relative">
                                          <input 
                                            type="file" multiple accept=".pdf,image/*" 
                                            onChange={(e) => e.target.files && handleContentUpload(selectedClass.id, sub.id, ch.id, t.id, 'unsolvedExercises', e.target.files)}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                          />
                                          <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest">
                                             <Upload size={10} /> + Practice
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 ml-2 pl-4 border-l border-white/10">
                                      <button onClick={() => editTopic(selectedClass.id, sub.id, ch.id, t.id, t.name)} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-nyra-primary transition-all">
                                        <Edit3 size={16} />
                                      </button>
                                      <button onClick={() => deleteTopic(selectedClass.id, sub.id, ch.id, t.id)} className="p-2 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 rounded-xl transition-all">
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* New Subject Modal */}
        <AnimatePresence>
          {isAddingSubject && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddingSubject(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 relative z-10 shadow-2xl overflow-hidden"
              >
                <h2 className="text-3xl font-display font-black tracking-tighter mb-2 text-white">Add Subject</h2>
                <p className="text-slate-400 text-sm mb-8">Deploy a new domain of knowledge to this battlefield.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Subject Name</label>
                    <input 
                      autoFocus
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="e.g. Quantum Physics / Organic Chemistry"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:border-nyra-primary outline-none transition-all text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateSubject();
                        if (e.key === 'Escape') setIsAddingSubject(false);
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 pt-4">
                    <button 
                      onClick={() => setIsAddingSubject(false)}
                      className="flex-1 px-6 py-4 border border-white/5 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreateSubject}
                      className="flex-[2] px-6 py-4 bg-nyra-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-nyra-primary/30"
                    >
                      Add Subject
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* New Chapter Modal */}
        <AnimatePresence>
          {isAddingChapter && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddingChapter(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 relative z-10 shadow-2xl"
              >
                <h2 className="text-3xl font-display font-black tracking-tighter mb-2 text-white">Initialize Folder</h2>
                <p className="text-slate-400 text-sm mb-8">Group research materials into a logical neural folder.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Folder Name</label>
                    <input 
                      autoFocus
                      value={newChapterName}
                      onChange={(e) => setNewChapterName(e.target.value)}
                      placeholder="e.g. Periodic Classification / Calculus"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:border-nyra-primary outline-none text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateChapter();
                        if (e.key === 'Escape') setIsAddingChapter(false);
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Examination Focus</label>
                    <div className="grid grid-cols-4 gap-2">
                       {(['FOUNDATION', 'BOARDS', 'JEE', 'UNIVERSAL'] as const).map(f => (
                         <button 
                           key={f}
                           onClick={() => setNewChapterFocus(f)}
                           className={`px-3 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${newChapterFocus === f ? 'bg-nyra-primary text-white' : 'bg-white/5 text-slate-500'}`}
                         >
                           {f}
                         </button>
                       ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-4">
                    <button onClick={() => setIsAddingChapter(false)} className="flex-1 px-6 py-4 border border-white/5 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
                    <button onClick={handleCreateChapter} className="flex-[2] px-6 py-4 bg-nyra-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Add Folder</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* New Topic/Material Modal */}
        <AnimatePresence>
          {isAddingTopic && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isUploading && setIsAddingTopic(null)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-[3rem] p-10 relative z-10 shadow-2xl"
              >
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Sparkles size={28} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-display font-black tracking-tighter text-white">Deploy Material</h2>
                      <p className="text-slate-400 text-sm">Upload slides or notes. Nyra will analyze them for wit & wisdom.</p>
                   </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Material Title</label>
                    <input 
                      autoFocus
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      placeholder="e.g. Session 01: Laws of Logarithms"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:border-nyra-primary outline-none text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Focus Type</label>
                    <div className="grid grid-cols-3 gap-2">
                       {(['FOUNDATION', 'BOARDS', 'JEE'] as const).map(f => (
                         <button 
                           key={f}
                           onClick={() => setNewTopicFocus(f)}
                           className={`px-3 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${newTopicFocus === f ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-500'}`}
                         >
                           {f}
                         </button>
                       ))}
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <input 
                      type="file" 
                      multiple 
                      accept=".pdf,image/*" 
                      onChange={(e) => e.target.files && handleTopicUpload(selectedClass.id, selectedSubjectId!, isAddingTopic, e.target.files)}
                      disabled={isUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    />
                    <div className={`w-full border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 transition-all ${isUploading ? 'border-nyra-primary bg-nyra-primary/5' : 'border-white/5 bg-black/20 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5'}`}>
                      {isUploading ? (
                        <>
                          <div className="w-12 h-12 border-4 border-nyra-primary/30 border-t-nyra-primary rounded-full animate-spin" />
                          <div className="text-center">
                            <div className="text-sm font-black text-white px-4">Nyra is scanning pages...</div>
                            <div className="text-[10px] text-slate-500 uppercase font-black mt-1">Wait for neural stabilization</div>
                          </div>
                        </>
                      ) : (
                         <>
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 transition-colors">
                               <Upload size={32} />
                            </div>
                            <div className="text-center">
                               <div className="text-sm font-black text-white">Drop PDFs / Images or Click to Deploy</div>
                               <div className="text-[10px] text-slate-500 uppercase font-black mt-1">Max 25 pages recommended for speed</div>
                            </div>
                         </>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsAddingTopic(null)}
                    disabled={isUploading}
                    className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all disabled:opacity-0"
                  >
                    Close Command
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Subject Modal */}
        <AnimatePresence>
          {editingSubject && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingSubject(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 relative z-10 shadow-2xl"
              >
                <h2 className="text-3xl font-display font-black tracking-tighter mb-2 text-white">Reconfigure Subject</h2>
                <p className="text-slate-400 text-sm mb-8">Update the intelligence parameters for this domain.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Subject Nomenclature</label>
                    <input 
                      autoFocus
                      value={editingSubject.name}
                      onChange={(e) => setEditingSubject({...editingSubject, name: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:border-nyra-primary outline-none transition-all text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateSubject();
                        if (e.key === 'Escape') setEditingSubject(null);
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 pt-4">
                    <button onClick={() => setEditingSubject(null)} className="flex-1 px-6 py-4 border border-white/5 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Abort</button>
                    <button onClick={handleUpdateSubject} className="flex-[2] px-6 py-4 bg-nyra-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Update Subject</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Class Modal */}
        <AnimatePresence>
          {editingClass && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingClass(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 relative z-10 shadow-2xl"
              >
                <h2 className="text-3xl font-display font-black tracking-tighter mb-2 text-white">Reconfigure Battlefront</h2>
                <p className="text-slate-400 text-sm mb-8">Update the nomenclature of this academic unit.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Class Name</label>
                    <input 
                      autoFocus
                      value={editingClass.name}
                      onChange={(e) => setEditingClass({...editingClass, name: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:border-nyra-primary outline-none transition-all text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateClass();
                        if (e.key === 'Escape') setEditingClass(null);
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 pt-4">
                    <button onClick={() => setEditingClass(null)} className="flex-1 px-6 py-4 border border-white/5 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Abort</button>
                    <button onClick={handleUpdateClass} className="flex-[2] px-6 py-4 bg-nyra-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Update Battlefront</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Chapter Modal */}
        <AnimatePresence>
          {editingChapter && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingChapter(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 relative z-10 shadow-2xl"
              >
                <h2 className="text-3xl font-display font-black tracking-tighter mb-2 text-white">Reconfigure Folder</h2>
                <p className="text-slate-400 text-sm mb-8">Refine the neural alignment of this chapter folder.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Folder Name</label>
                    <input 
                      autoFocus
                      value={editingChapter.name}
                      onChange={(e) => setEditingChapter({...editingChapter, name: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:border-nyra-primary outline-none transition-all text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateChapter();
                        if (e.key === 'Escape') setEditingChapter(null);
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Neural Focus</label>
                    <div className="grid grid-cols-4 gap-2">
                       {(['FOUNDATION', 'BOARDS', 'JEE', 'UNIVERSAL'] as const).map(f => (
                         <button 
                           key={f}
                           onClick={() => setEditingChapter({...editingChapter, focus: f})}
                           className={`px-3 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${editingChapter.focus === f ? 'bg-nyra-primary text-white' : 'bg-white/5 text-slate-500'}`}
                         >
                           {f}
                         </button>
                       ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-4">
                    <button onClick={() => setEditingChapter(null)} className="flex-1 px-6 py-4 border border-white/5 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Abort</button>
                    <button onClick={handleUpdateChapter} className="flex-[2] px-6 py-4 bg-nyra-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Patch Folder</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Topic Modal */}
        <AnimatePresence>
          {editingTopic && (
            <div className="fixed inset-0 z-[140] flex items-center justify-center p-6 px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingTopic(null)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[3rem] p-10 relative z-10 shadow-2xl"
              >
                <h2 className="text-3xl font-display font-black tracking-tighter mb-2 text-white">Refine Material</h2>
                <p className="text-slate-400 text-sm mb-8">Update the nomenclature and focus of this intelligence layer.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Material Title</label>
                    <input 
                      autoFocus
                      value={editingTopic.name}
                      onChange={(e) => setEditingTopic({...editingTopic, name: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:border-nyra-primary outline-none text-white transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateTopic();
                        if (e.key === 'Escape') setEditingTopic(null);
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Strategic Focus</label>
                    <div className="grid grid-cols-4 gap-2">
                       {(['FOUNDATION', 'BOARDS', 'JEE', 'UNIVERSAL'] as const).map(f => (
                         <button 
                           key={f}
                           onClick={() => setEditingTopic({...editingTopic, focus: f})}
                           className={`px-3 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${editingTopic.focus === f ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-500'}`}
                         >
                           {f}
                         </button>
                       ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-4">
                    <button onClick={() => setEditingTopic(null)} className="flex-1 px-6 py-4 border border-white/5 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Discard</button>
                    <button onClick={handleUpdateTopic} className="flex-[2] px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Apply Shifts</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Learning Objectives Modal */}
        <AnimatePresence>
          {isEditingObjectives && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEditingObjectives(null)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[3rem] p-10 relative z-10 shadow-2xl"
              >
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-14 h-14 rounded-2xl bg-nyra-primary/10 flex items-center justify-center text-nyra-primary">
                      <List size={28} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-display font-black tracking-tighter text-white">Learning Objectives</h2>
                      <p className="text-slate-400 text-sm">Set instructions and key points for Nyra to cover in "{isEditingObjectives.name}".</p>
                   </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 px-1 flex items-center gap-2">
                       <Sparkles size={12} className="text-nyra-primary" />
                       Key Learning Points (One per line)
                    </label>
                    <textarea 
                      autoFocus
                      value={tempObjectives}
                      onChange={(e) => setTempObjectives(e.target.value)}
                      placeholder="What should the student learn by the end of this session or slide?&#10;Point 1: Explain the core logic of...&#10;Point 2: Solve 3 complex problems on...&#10;Point 3: Mention the historical context of..."
                      className="w-full bg-black/40 border border-white/5 rounded-3xl px-8 py-6 text-sm focus:border-nyra-primary outline-none text-white transition-all min-h-[250px] resize-none leading-relaxed"
                    />
                  </div>
                  
                  <div className="p-4 bg-nyra-primary/5 border border-nyra-primary/10 rounded-2xl">
                    <p className="text-[10px] text-nyra-primary/80 font-medium italic leading-relaxed">
                      "Nyra will internalize these points as her core mission for this topic. She will ensure they are discussed and mastered before finishing the session."
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-4">
                    <button 
                      onClick={() => setIsEditingObjectives(null)}
                      className="flex-1 px-6 py-4 border border-white/5 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
                    >
                      Discard
                    </button>
                    <button 
                      onClick={handleUpdateObjectives}
                      className="flex-[2] px-6 py-4 bg-nyra-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-nyra-primary/20"
                    >
                      Deploy Objectives
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex bg-nyra-dark text-slate-200 fixed inset-0 overflow-hidden font-sans">
      {/* Cinematic Sidebar */}
      <aside className="w-80 flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-3xl z-50">
        <div className="p-8 pb-4">
           <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-2xl bg-nyra-primary flex items-center justify-center shadow-xl shadow-nyra-primary/20 rotate-3">
                 <Sparkles className="text-white" size={24} />
              </div>
              <div className="flex flex-col">
                 <span className="text-2xl font-display font-black tracking-tighter text-white">Academic Studio</span>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-nyra-primary/60">Nyra Master Control</span>
              </div>
           </div>

           <div className="flex flex-col gap-2">
              <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2 px-2">War Room Sections</div>
              {(['curriculum', 'analytics', 'announcements', 'exams', 'help'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab !== 'curriculum') {
                      setSelectedClassId(null);
                      setSelectedSubjectId(null);
                    }
                  }}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all group relative ${
                    activeTab === tab 
                      ? 'bg-nyra-primary text-white shadow-xl shadow-nyra-primary/20' 
                      : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab === 'curriculum' && <BookOpen size={18} />}
                  {tab === 'analytics' && <BarChart3 size={18} />}
                  {tab === 'announcements' && <Send size={18} />}
                  {tab === 'exams' && <CheckCircle2 size={18} />}
                  {tab === 'help' && <Info size={18} />}
                  <span>{tab}</span>
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activeTabGlow"
                      className="absolute inset-0 bg-nyra-primary blur-2xl opacity-20 -z-10 rounded-2xl"
                    />
                  )}
                </button>
              ))}
           </div>
        </div>

        <div className="mt-auto p-8 border-t border-white/5 flex flex-col gap-4">
           <button 
             onClick={onSwitchToStudent}
             className="w-full flex items-center justify-between p-4 px-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10"
           >
              Switch ID: Student 
              <ChevronRight size={14} />
           </button>
           <button onClick={onLogout} className="w-full p-4 px-6 text-slate-500 border border-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Destroy Session</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.05),transparent_70%)]">
        {/* Holographic Header */}
        <header className="h-24 px-12 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-40">
           <div>
              <h1 className="text-2xl font-display font-black tracking-tighter text-white capitalize">{activeTab}</h1>
              <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">{selectedClass ? `Command Center: ${selectedClass.name}` : 'Neural Network Management'}</p>
           </div>

           <div className="flex items-center gap-8">
              <div className="flex flex-col items-end gap-1">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Intelligence Pulse</span>
                 <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                       <motion.div animate={{ x: [-64, 64] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-full h-full bg-nyra-primary shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
                    </div>
                    <span className="text-xs font-black text-nyra-primary font-mono tracking-tighter">98.4ms</span>
                 </div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex items-center gap-4 group cursor-pointer">
                 <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-white tracking-tighter">Nyra Prime Mentor</span>
                    <span className="text-[8px] font-black text-nyra-primary uppercase tracking-widest">Master Admin</span>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-nyra-primary to-indigo-600 p-0.5 shadow-xl shadow-nyra-primary/20 transition-transform group-hover:scale-105">
                    <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center">
                       <Users size={20} className="text-white" />
                    </div>
                 </div>
              </div>
           </div>
        </header>

        <section className="flex-1 overflow-y-auto p-12 custom-scrollbar relative">
          <AnimatePresence mode="wait">
            {activeTab === 'curriculum' ? (
              <motion.div
                key="curriculum"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                {!selectedClassId ? (
                  <div className="space-y-12">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-3xl font-display font-black tracking-tighter">Curriculum Matrix</h2>
                        <p className="text-slate-500 font-medium">Select a battlefront to deploy intelligence.</p>
                      </div>
                      <button 
                        onClick={() => setIsAddingClass(true)}
                        className="px-6 py-3 bg-nyra-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-nyra-primary/30"
                      >
                        Initialize New Class
                      </button>
                    </div>

                    {/* New Class Modal */}
                    <AnimatePresence>
                      {isAddingClass && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 px-4">
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddingClass(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                          />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 relative z-10 shadow-2xl overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 pointer-events-none">
                              <Plus size={120} />
                            </div>
                            
                            <h2 className="text-3xl font-display font-black tracking-tighter mb-2 text-white">New Battlefront</h2>
                            <p className="text-slate-500 text-sm mb-8 font-medium">Initialize a new academic class to deploy intelligence layers.</p>
                            
                            <div className="space-y-6 text-left">
                              <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Class Nomenclature</label>
                                <input 
                                  autoFocus
                                  value={newClassName}
                                  onChange={(e) => setNewClassName(e.target.value)}
                                  placeholder="e.g. Class 12 PCM / JEE Batch A"
                                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:border-nyra-primary outline-none transition-all placeholder:text-slate-700 text-white"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateClass();
                                    if (e.key === 'Escape') setIsAddingClass(false);
                                  }}
                                />
                              </div>
                              
                              <div className="flex items-center gap-4 pt-4">
                                <button 
                                  onClick={() => setIsAddingClass(false)}
                                  className="flex-1 px-6 py-4 border border-white/5 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
                                >
                                  Abort
                                </button>
                                <button 
                                  onClick={handleCreateClass}
                                  className="flex-[2] px-6 py-4 bg-nyra-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-nyra-primary/30 hover:bg-nyra-primary/90 transition-all"
                                >
                                  Initialize Class
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {data.map(c => (
                        <div key={c.id} className="relative group">
                          <button
                            onClick={() => setSelectedClassId(c.id)}
                            className="w-full p-8 nyra-glass rounded-[3rem] border border-white/5 hover:border-nyra-primary/30 text-left transition-all relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-nyra-primary/10 transition-colors">
                              <BookOpen size={100} />
                            </div>
                            <div className="w-12 h-12 bg-nyra-primary/10 rounded-2xl flex items-center justify-center text-nyra-primary mb-6 group-hover:scale-110 transition-transform">
                              <Users size={24} />
                            </div>
                            <h3 className="text-xl font-black tracking-tight mb-2">{c.name}</h3>
                            <p className="text-slate-500 text-xs font-bold">{c.subjects.length} Intelligence Streams</p>
                            <div className="mt-8 flex items-center gap-2 text-nyra-primary font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                              Manage Class <ChevronRight size={14} />
                            </div>
                          </button>
                          <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); editClass(c.id, c.name); }} 
                              className="p-2 bg-slate-900/80 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteClass(c.id); }} 
                              className="p-2 bg-slate-900/80 border border-white/10 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <button 
                      onClick={() => setSelectedClassId(null)}
                      className="mb-8 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
                    >
                      <ChevronRight className="rotate-180" size={14} /> Back to Hub
                    </button>
                    {viewMode === 'ledger' ? <MasterCurriculumLedger /> : <MasterCurriculumLedger />}
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'analytics' ? (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-3xl font-display font-black tracking-tighter text-white">Strategic Intelligence</h2>
                  <p className="text-slate-500 font-medium">Real-time performance audit across all active intelligence streams.</p>
               </div>
               <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5 shadow-2xl">
                  <div className="flex flex-col items-end px-4">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Global Precision</span>
                     <span className="text-lg font-black text-white">82.4%</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col items-end px-4">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Active Now</span>
                     <span className="text-lg font-black text-emerald-500">1,240</span>
                  </div>
               </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "Total Students", value: "156", icon: Users, color: "text-nyra-primary", progress: "+8%" },
                { label: "Avg. Test Score", value: "78%", icon: TrendingUp, color: "text-emerald-400", progress: "+12%" },
                { label: "Active Today", value: "42", icon: Calendar, color: "text-amber-400", progress: "-3%" },
                { label: "Neural Sessions", value: "1,240", icon: Sparkles, color: "text-nyra-primary", progress: "+24%" },
              ].map((stat, i) => (
                <div key={i} className="p-8 nyra-glass border border-white/5 rounded-[3rem] hover:border-white/10 transition-all group overflow-hidden relative">
                  <div className="absolute -bottom-4 -right-4 text-white/5 group-hover:text-nyra-primary/10 transition-colors pointer-events-none">
                    <stat.icon size={80} />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-white/5 rounded-2xl ${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${stat.progress.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {stat.progress}
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white tracking-tighter mb-1">{stat.value}</div>
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-8 bg-slate-900/50 border border-white/5 rounded-[2.5rem] flex flex-col h-[400px]">
              <h3 className="text-lg font-bold mb-8">Quiz Performance (By Student)</h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-8 bg-slate-900/50 border border-white/5 rounded-[2.5rem] flex flex-col h-[400px]">
              <h3 className="text-lg font-bold mb-8">Platform Engagement</h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={studentStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    />
                    <Line type="monotone" dataKey="studyTime" stroke="#818cf8" strokeWidth={3} dot={{ fill: '#818cf8', r: 4 }} name="Time (min)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="p-8 bg-slate-900/50 border border-white/5 rounded-[2.5rem]">
            <h3 className="text-lg font-bold mb-6">Student Progress Tracking</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    <th className="pb-4 pt-0 px-4">Student</th>
                    <th className="pb-4 pt-0 px-4 text-center">Time Spent</th>
                    <th className="pb-4 pt-0 px-4 text-center">Quiz Score</th>
                    <th className="pb-4 pt-0 px-4 text-center">Last Accessed Topic</th>
                    <th className="pb-4 pt-0 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentStats.map((student, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0 group hover:bg-white/5 transition-all">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center font-bold text-slate-400 group-hover:bg-nyra-primary group-hover:text-white transition-all">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="font-bold">{student.name}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-slate-400 font-medium">{student.studyTime} min</td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-emerald-400">{student.score}%</span>
                          <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${student.score > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${student.score}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs px-3 py-1 bg-white/5 rounded-full border border-white/5 text-slate-400">
                          {student.lastTopic}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          Active
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      ) : activeTab === 'exams' ? (
        <motion.div
          key="exams"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 p-10 overflow-y-auto custom-scrollbar"
        >
          <div className="max-w-6xl mx-auto space-y-8">
            {viewingTestSubmissions ? (
            <div className="space-y-8">
               <div className="flex items-center justify-between">
                 <div>
                   <button 
                     onClick={() => setViewingTestSubmissions(null)}
                     className="flex items-center gap-2 text-xs font-black text-nyra-primary uppercase tracking-widest mb-2 hover:opacity-70"
                   >
                     <ChevronRight size={14} className="rotate-180" /> Back to Missions
                   </button>
                   <h2 className="text-3xl font-display font-bold">Results: {tests.find(t => t.id === viewingTestSubmissions)?.title}</h2>
                   <p className="text-slate-500 text-sm">Real-time performance audit for all candidate sessions.</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="p-6 bg-slate-900 border border-white/5 rounded-3xl">
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Candidates</div>
                   <div className="text-2xl font-black">{testSubmissions.length}</div>
                 </div>
                 <div className="p-6 bg-slate-900 border border-white/5 rounded-3xl">
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Average Score</div>
                   <div className="text-2xl font-black">
                     {testSubmissions.length > 0 
                        ? Math.round(testSubmissions.reduce((acc, s) => acc + s.score, 0) / testSubmissions.length) 
                        : 0}
                   </div>
                 </div>
                 <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                   <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Highest Score</div>
                   <div className="text-2xl font-black text-emerald-500">
                     {testSubmissions.length > 0 ? Math.max(...testSubmissions.map(s => s.score)) : 0}
                   </div>
                 </div>
                 <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                   <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Total Violations</div>
                   <div className="text-2xl font-black text-rose-500">
                     {testSubmissions.reduce((acc, s) => acc + (s.analysis?.integrityViolations || 0), 0)}
                   </div>
                 </div>
               </div>

               <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-950/50">
                       <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] w-16">Rank</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Student UID</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Score</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Accuracy</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Time</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Flags</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {testSubmissions.sort((a, b) => b.score - a.score).map((s, idx) => (
                       <tr key={s.id} className="hover:bg-white/5 transition-colors">
                         <td className="px-8 py-6 font-mono text-xs text-nyra-primary font-bold">#{idx + 1}</td>
                         <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-nyra-primary/10 flex items-center justify-center font-bold text-xs text-nyra-primary">
                               {s.studentId.substring(0, 2).toUpperCase()}
                             </div>
                             <span className="font-bold text-xs">{s.studentId}</span>
                           </div>
                         </td>
                         <td className="px-8 py-6 font-bold">{s.score} / {s.totalMarks}</td>
                         <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                             <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-500" style={{ width: `${s.analysis?.accuracy}%` }} />
                             </div>
                             <span className="text-[10px] font-black">{Math.round(s.analysis?.accuracy || 0)}%</span>
                           </div>
                         </td>
                         <td className="px-8 py-6 text-xs text-slate-400">{Math.floor(s.timeSpent / 60)}m {s.timeSpent % 60}s</td>
                         <td className="px-8 py-6">
                           {s.analysis?.integrityViolations ? (
                             <span className="px-2 py-1 bg-rose-500/20 text-rose-500 text-[9px] font-black rounded-lg uppercase tracking-widest animate-pulse">
                               {s.analysis.integrityViolations} Violations
                             </span>
                           ) : (
                             <span className="text-emerald-500 text-[10px] font-bold">CLEAN</span>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          ) : isCreatingTest || editingTest ? (
            <TestBuilder 
              classes={data} 
              existingTests={tests} 
              onClose={() => { setIsCreatingTest(false); setEditingTest(null); }} 
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h2 className="text-3xl font-display font-bold">Neural Mission Command</h2>
                    <p className="text-slate-500">Design assessments and monitor student performance in real-time.</p>
                 </div>
                 <button 
                   onClick={() => setIsCreatingTest(true)}
                   className="flex items-center gap-3 px-8 py-4 bg-nyra-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-nyra-primary/90 transition-all shadow-xl shadow-nyra-primary/40"
                 >
                   <Plus size={16} />
                   Initiate New Mission
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map((test) => (
                  <div key={test.id} className="p-8 bg-slate-900 border border-white/5 rounded-[3rem] group hover:border-nyra-primary/30 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-white opacity-[0.03] group-hover:opacity-[0.08] transition-all rotate-12">
                      <Sparkles size={120} />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                         test.status === 'Published' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                       }`}>
                         {test.status}
                       </span>
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{test.duration}m</span>
                    </div>

                    <h3 className="text-xl font-bold mb-2 group-hover:text-nyra-primary transition-colors">{test.title}</h3>
                    <p className="text-sm text-slate-500 mb-8 line-clamp-2 leading-relaxed">{test.description}</p>

                    <div className="flex flex-col gap-4 mt-auto">
                       <div className="flex items-center justify-between py-4 border-y border-white/5">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Total Marks</span>
                             <span className="font-mono text-sm font-bold">{test.totalMarks} Points</span>
                          </div>
                          <div className="flex flex-col text-right">
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Target</span>
                             <span className="text-xs font-bold uppercase">{test.examType}</span>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3">
                         <button 
                           onClick={() => setViewingTestSubmissions(test.id)}
                           className="flex items-center justify-center gap-2 px-4 py-3 bg-nyra-primary/10 border border-nyra-primary/20 text-nyra-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-nyra-primary hover:text-white transition-all shadow-lg"
                         >
                           <BarChart3 size={14} /> Reports
                         </button>
                         <button 
                           onClick={() => setEditingTest(test)}
                           className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                         >
                           <Edit3 size={14} /> Edit
                         </button>
                       </div>
                    </div>
                  </div>
                ))}
                
                {tests.length === 0 && (
                  <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[4rem] opacity-30">
                    <Sparkles size={64} className="mx-auto mb-6" />
                    <h3 className="text-xl font-bold mb-2">No Mission Profiles Found</h3>
                    <p className="text-sm">Initiate your first test mission using the launcher above.</p>
                  </div>
                )}
              </div>
            </>
          )}
          </div>
        </motion.div>
      ) : activeTab === 'help' ? (
      <motion.div
        key="help"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex-1 p-10 overflow-y-auto custom-scrollbar"
      >
        <TeacherManual />
      </motion.div>
    ) : (
      <motion.div
        key="announcements"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex-1 p-10 overflow-y-auto custom-scrollbar"
      >
        <div className="max-w-4xl mx-auto space-y-10">
          <div>
            <h2 className="text-3xl font-display font-bold">Direct Announcements</h2>
            <p className="text-slate-500">Broadcast important updates to your classes instantly</p>
          </div>

          <div className="p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Target Audience</label>
              <select 
                value={selectedClassId || ""}
                onChange={(e) => setSelectedClassId(e.target.value || null)}
                className="w-full bg-nyra-dark border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-nyra-primary outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">All Registered Classes</option>
                {data.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Message Content</label>
              <textarea 
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Type your announcement here (e.g., Assignment deadlines, Holiday notices)..."
                rows={6}
                className="w-full bg-nyra-dark border border-slate-800 rounded-3xl px-6 py-6 text-sm focus:border-nyra-primary outline-none transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="text-[10px] text-slate-500 italic">
                The announcement will be sent as a push notification and show up on student dashboards.
              </div>
              <button 
                onClick={handleSendAnnouncement}
                disabled={!announcementText.trim()}
                className="flex items-center gap-3 px-8 py-4 bg-nyra-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-nyra-primary/90 transition-all shadow-xl shadow-nyra-primary/40 disabled:opacity-50"
              >
                <Send size={16} />
                Broadcast Now
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold">Recent Announcements</h3>
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-white/10 transition-all flex items-start gap-4">
                  <div className="p-3 bg-nyra-primary/10 text-nyra-primary rounded-2xl">
                    <Bell size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{ann.target} • {ann.date}</span>
                      <button 
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{ann.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};

export default TeacherDashboard;
