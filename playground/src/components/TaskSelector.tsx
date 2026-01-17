import { TaskType, TASKS } from "../types";

interface TaskSelectorProps {
  selectedTask: TaskType;
  onTaskChange: (task: TaskType) => void;
}

export function TaskSelector({ selectedTask, onTaskChange }: TaskSelectorProps) {
  const taskEntries = Object.entries(TASKS) as [TaskType, typeof TASKS[TaskType]][];

  return (
    <div className="space-y-2">
      <label htmlFor="task" className="block text-sm font-medium text-gray-300">
        Select Task
      </label>
      <select
        id="task"
        value={selectedTask}
        onChange={(e) => onTaskChange(e.target.value as TaskType)}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg
                   text-white focus:outline-none focus:ring-2 focus:ring-blue-500
                   focus:border-transparent"
      >
        {taskEntries.map(([taskType, config]) => (
          <option key={taskType} value={taskType}>
            {config.name}
          </option>
        ))}
      </select>
      <p className="text-sm text-gray-500">{TASKS[selectedTask].description}</p>
      <p className="text-xs text-gray-600">
        Default model: {TASKS[selectedTask].defaultModel}
      </p>
    </div>
  );
}
