// TaskAI Simple App - Test Version
console.log('TaskAI Test App loaded successfully!');

// Простое приложение без Vite
class TaskAI {
    constructor() {
        this.tasks = [
            {
                id: 1,
                title: "Настроить Supabase",
                description: "Создать .env файл с настройками Supabase",
                completed: false,
                priority: "high",
                category: "Разработка"
            },
            {
                id: 2,
                title: "Демо-задача",
                description: "Это пример задачи для демонстрации",
                completed: false,
                priority: "medium",
                category: "Личное"
            }
        ];
        this.init();
    }

    init() {
        console.log('Initializing TaskAI...');
        this.render();
    }

    render() {
        const root = document.getElementById('root');
        if (!root) {
            console.error('Root element not found!');
            return;
        }

        root.innerHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh;">
                <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 15px; backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
                    <h1 style="text-align: center; margin-bottom: 30px; font-size: 2.5em;">🧠 TaskAI</h1>
                    
                    <div style="text-align: center; margin: 20px 0; padding: 10px; background: rgba(76, 175, 80, 0.3); border-radius: 5px;">
                        ✅ Сайт работает! JavaScript загружается корректно.
                    </div>
                    
                    <h2>Задачи:</h2>
                    ${this.tasks.map(task => `
                        <div style="background: rgba(255, 255, 255, 0.2); padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid ${this.getPriorityColor(task.priority)}; cursor: pointer;" onclick="taskAI.toggleTask(${task.id})">
                            <h3>${task.title}</h3>
                            <p>${task.description}</p>
                            <small>Приоритет: ${this.getPriorityText(task.priority)} | Категория: ${task.category}</small>
                        </div>
                    `).join('')}
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <p>Если вы видите эту страницу, значит GitHub Pages работает корректно!</p>
                        <p>Проблема была в MIME типах для Vite-собранных файлов.</p>
                    </div>
                </div>
            </div>
        `;
    }

    getPriorityColor(priority) {
        switch(priority) {
            case 'high': return '#f44336';
            case 'medium': return '#ff9800';
            case 'low': return '#4CAF50';
            default: return '#4CAF50';
        }
    }

    getPriorityText(priority) {
        switch(priority) {
            case 'high': return 'Высокий';
            case 'medium': return 'Средний';
            case 'low': return 'Низкий';
            default: return 'Средний';
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.render();
            console.log(`Task ${id} toggled:`, task.completed);
        }
    }
}

// Инициализация приложения
const taskAI = new TaskAI();
