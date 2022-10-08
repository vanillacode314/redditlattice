export interface IAction {
  id: string;
  icon: string;
  callback: Function;
}

export enum SortType {
  HOT = "hot",
  NEW = "new",
  TOP = "top",
}

export interface IRemotePostsData {
  children: { data: IPost }[];
  after: string;
}

export interface IPost {
  is_self: boolean;
  is_video: boolean;
  media: unknown;
  media_metadata: Record<string, any>;
  name: string;
  url: string;
  title: string;
}
