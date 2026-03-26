/**
 * 此文件由 openapi-typescript 自动生成
 * 运行 `npm run generate:types` 更新
 *
 * 手动编写的临时类型定义 (等待 openapi-typescript 生成后会被覆盖)
 */

export interface paths {
  '/auth/register': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            email: string;
            password: string;
            username: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['AuthResponse'];
          };
        };
      };
    };
  };
  '/auth/login': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            email: string;
            password: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['AuthResponse'];
          };
        };
      };
    };
  };
  '/auth/me': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': {
              code: number;
              data: components['schemas']['User'];
            };
          };
        };
      };
    };
  };
}

export interface components {
  schemas: {
    User: {
      id: number;
      username: string;
      email: string;
      avatar?: string | null;
      role: 'user' | 'admin';
      createdAt: string;
    };

    AuthResponse: {
      code: number;
      message: string;
      data: {
        accessToken: string;
        user: components['schemas']['User'];
      };
    };

    Location: {
      lng: number;
      lat: number;
    };

    Story: {
      id: number;
      content?: string | null;
      images: string[];
      location: components['schemas']['Location'];
      emotionTag: '治愈' | '难过' | '开心' | '打卡';
      isTimeCapsule: boolean;
      unlockAt?: string | null;
      viewCount: number;
      visibility: 'public' | 'shadowban';
      createdAt: string;
      author: {
        id: number;
        username: string;
        avatar: string;
      };
    };

    CreateStoryRequest: {
      content?: string | null;
      images: string[];
      location?: components['schemas']['Location'];
      emotionTag: '治愈' | '难过' | '开心' | '打卡';
      isTimeCapsule?: boolean;
      unlockAt?: string | null;
    };

    UploadTokenResponse: {
      code: number;
      data: {
        accessKeyId: string;
        accessKeySecret: string;
        stsToken: string;
        bucket: string;
        region: string;
        expiration: string;
      };
    };

    MapStory: {
      id: number;
      location: components['schemas']['Location'];
      emotionTag: string;
      preview: string;
      distance: number;
      createdAt: string;
      isTimeCapsule: boolean;
    };

    PaginatedStories: {
      code: number;
      data: {
        total: number;
        page: number;
        limit: number;
        list: components['schemas']['Story'][];
      };
    };

    SuccessResponse: {
      code: number;
      message: string;
      data?: any;
    };

    ErrorResponse: {
      code: number;
      message: string;
      data: null;
    };
  };
}
