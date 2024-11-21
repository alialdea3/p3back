import type { Tarea, TareaModel } from "./types.ts";

export const fromModelToTarea = (
  tareaDB: TareaModel,
): Tarea => {
  return {
    id: tareaDB._id!.toString(),
    titulo: tareaDB.titulo,
    completed: tareaDB.completed,
  };
};
