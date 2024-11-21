import { ObjectId, type OptionalId } from "mongodb";

export type TareaModel = OptionalId<{
  _id: ObjectId;
  titulo: string;
  completed: boolean;
}>;

export type Tarea = {
  id: string;
  titulo: string;
  completed: boolean;
};
