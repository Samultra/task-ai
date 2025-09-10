import { useState, useEffect } from "react";
import { Brain, Calendar, CheckCircle2, Clock, Filter, MessageSquare, Sparkles, Star, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskCard, { Task } from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";
import AIChat from "@/components/AIChat";
import { useToast } from "@/hooks/use-toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { registerServiceWorker, requestPermission, startTipsScheduler, stopTipsScheduler, showNotification } from "@/lib/notifications";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [tipsEnabled, setTipsEnabled] = useState(false);
  const { toast } = useToast();

  const loadTasks = async () => {
    console.log('Loading tasks...', new Date().toISOString());
    
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, using demo tasks');
      // Показываем демо-задачи, если Supabase не настроен
      const demoTasks: Task[] = [
        {
          id: "1",
          title: "Настроить Supabase",
          description: "Создать .env файл с настройками Supabase",
          completed: false,
          priority: "high",
          category: "Разработка",
          createdAt: new Date(),
        },
        {
          id: "2", 
          title: "Демо-задача",
          description: "Это пример задачи для демонстрации",
          completed: false,
          priority: "medium",
          category: "Личное",
          createdAt: new Date(),
        }
      ];
      setTasks(demoTasks);
      toast({ 
        title: "Supabase не настроен", 
        description: "Создайте .env файл с настройками Supabase. См. SUPABASE_SETUP_INSTRUCTIONS.md", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, description, completed, priority, category, due_date, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        toast({ title: "Ошибка загрузки задач", description: error.message, variant: "destructive" });
        return;
      }

      console.log('Tasks loaded:', data?.length || 0);
      const mapped: Task[] = (data ?? []).map((t: any) => ({
        id: String(t.id),
        title: t.title,
        description: t.description ?? undefined,
        completed: Boolean(t.completed),
        priority: (t.priority ?? "medium") as Task["priority"],
        category: t.category ?? "Личное",
        dueDate: t.due_date ? new Date(t.due_date) : undefined,
        createdAt: t.created_at ? new Date(t.created_at) : new Date(),
        subtasks: undefined,
        plan: undefined
      }));

      setTasks(mapped);
    } catch (err) {
      console.error('Load tasks error:', err);
      toast({ title: "Ошибка загрузки", description: "Не удалось загрузить задачи", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const togglePush = async () => {
    if (!tipsEnabled) {
      const granted = await requestPermission();
      if (!granted) {
        toast({ title: "Уведомления отключены", description: "Разрешите отправку уведомлений в браузере.", variant: "destructive" });
        return;
      }
      const reg = await registerServiceWorker();
      if (!reg) {
        toast({ title: "Сервис-воркер не зарегистрирован", description: "Браузер не поддерживает SW.", variant: "destructive" });
        return;
      }
      setTipsEnabled(true);
      startTipsScheduler(60);
      await showNotification("TaskAI", "Push-советы по тайм-менеджменту включены!");
    } else {
      stopTipsScheduler();
      setTipsEnabled(false);
      await showNotification("TaskAI", "Push-советы отключены");
    }
  };

  const addTask = async (taskData: Omit<Task, "id" | "completed" | "createdAt">) => {
    const payload = {
      title: taskData.title,
      description: taskData.description ?? null,
      completed: false,
      priority: taskData.priority,
      category: taskData.category,
      due_date: taskData.dueDate ? taskData.dueDate.toISOString() : null,
    };

    const { data, error } = await supabase.from("tasks").insert(payload).select("id, created_at").single();

    if (error) {
      toast({ title: "Не удалось добавить задачу", description: error.message, variant: "destructive" });
      return;
    }

    const newTask: Task = {
      ...taskData,
      id: String(data?.id ?? Date.now()),
      completed: false,
      createdAt: data?.created_at ? new Date(data.created_at) : new Date()
    };

    setTasks(prev => [newTask, ...prev]);
    toast({ title: "Задача добавлена!", description: `"${taskData.title}" успешно добавлена в список дел.` });
  };

  const toggleTaskComplete = async (id: string) => {
    const existing = tasks.find(t => t.id === id);
    const newCompleted = existing ? !existing.completed : true;

    const { error } = await supabase.from("tasks").update({ completed: newCompleted }).eq("id", id);

    if (error) {
      toast({ title: "Не удалось обновить задачу", description: error.message, variant: "destructive" });
      return;
    }

    setTasks(prev => prev.map(task => task.id === id ? { ...task, completed: newCompleted } : task));
    if (existing) {
      toast({
        title: newCompleted ? "Задача выполнена!" : "Задача возобновлена",
        description: newCompleted ? `Отличная работа! "${existing.title}" завершена.` : `"${existing.title}" помечена как невыполненная.`
      });
    }
  };

  const deleteTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      toast({ title: "Не удалось удалить задачу", description: error.message, variant: "destructive" });
      return;
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    if (task) {
      toast({ title: "Задача удалена", description: `"${task.title}" была удалена из списка.`, variant: "destructive" });
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    // Временно обновляем только локально до добавления полей в БД
    console.log('Updating task locally:', id, updates);
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
    
    // Показываем уведомление о том, что данные сохранены локально
    if ('subtasks' in updates || 'plan' in updates) {
      toast({ 
        title: "Данные сохранены локально", 
        description: "После добавления полей в БД данные будут сохраняться постоянно" 
      });
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === "pending") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    highPriority: tasks.filter(t => t.priority === "high" && !t.completed).length
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className={`max-w-6xl mx-auto transition-all duration-300 ${isChatOpen ? 'lg:mr-80 xl:mr-96' : ''}`}>
        {/* Header */}
        <header className="mb-8 animate-fade-in -mt-2">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-ai bg-clip-text text-transparent">
                TaskAI
              </h1>
              <p className="text-muted-foreground mt-2">
                Где мысль находит форму, а действие — своё время
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setIsChatOpen(true)}
                className="bg-gradient-ai hover:shadow-glow transition-all duration-300 group"
                size="lg"
              >
                <Brain className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                ИИ-Помощник
                <Sparkles className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform" />
              </Button>
              <Button
                variant={tipsEnabled ? "default" : "outline"}
                onClick={togglePush}
                size="lg"
                className={tipsEnabled ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              >
                {tipsEnabled ? <BellOff className="h-5 w-5 mr-2" /> : <Bell className="h-5 w-5 mr-2" />}
                {tipsEnabled ? 'Отключить Push' : 'Push'}
              </Button>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-effect shadow-card p-4 hover:shadow-floating transition-all">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Всего задач</p>
              </div>
            </div>
          </Card>

          <Card className="glass-effect shadow-card p-4 hover:shadow-floating transition-all">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Выполнено</p>
              </div>
            </div>
          </Card>

          <Card className="glass-effect shadow-card p-4 hover:shadow-floating transition-all">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">В работе</p>
              </div>
            </div>
          </Card>

          <Card className="glass-effect shadow-card p-4 hover:shadow-floating transition-all">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.highPriority}</p>
                <p className="text-sm text-muted-foreground">Приоритетные</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Task Form */}
        <div className="mb-8">
          <TaskForm onAddTask={addTask} defaultExpanded />
        </div>

        {/* Tasks Section */}
        <Card className="glass-effect shadow-card">
          <div className="p-6">
            <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-semibold">Мои задачи</h2>
                <div className="w-full sm:w-auto overflow-x-auto">
                  <TabsList className="grid grid-cols-3 sm:inline-flex min-w-[360px]">
                    <TabsTrigger value="all">Все ({stats.total})</TabsTrigger>
                    <TabsTrigger value="pending">Активные ({stats.pending})</TabsTrigger>
                    <TabsTrigger value="completed">Готовые ({stats.completed})</TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value={filter} className="space-y-4">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task, index) => (
                    <div 
                      key={task.id}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <TaskCard
                        task={task}
                        onToggleComplete={toggleTaskComplete}
                        onDelete={deleteTask}
                        onUpdateTask={updateTask}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">
                      {filter === "completed" ? "Нет выполненных задач" :
                       filter === "pending" ? "Нет активных задач" :
                       "Пока нет задач"}
                    </p>
                    <p className="text-sm">
                      {filter === "all" ? "Добавьте первую задачу выше" : "Попробуйте изменить фильтр"}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Floating Chat Button for Mobile */}
        {!isChatOpen && (
          <Button
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-ai shadow-floating hover:shadow-glow transition-all duration-300 lg:hidden z-40"
            size="lg"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* AI Chat Sidebar */}
      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default Index;