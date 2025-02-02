// types.ts
export interface VideoDoc {
    id: string;
    videoUrl: string;
    thumbnailUrl?: string;
    uploadedAt: any;
    title?: string;
    description?: string;
    gsUri?: string;
    thumbGSUri?: string;
    videoFileName?: string;
    m_id?: number;
    moment_name?: string;
}

export interface Moment {
    moment_name: string;
    m_id: number;
}

export interface VideoUploadPayload {
    video_id: string;
    user_id: string;
    style: string;
    gender: string;
    accent: string;
    video_name: string;
    moment_name: string;
    game_name: string;
    game_date: string;
    game_history: string;
}
