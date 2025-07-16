// Project repository implementation

import { BaseRepository } from './base';
import { 
  Project, 
  Outline, 
  WritingStyle, 
  Language,
  Character,
  WorldSetting,
  PlotStructure,
  Conflict,
  Chapter
} from '../models/index';
import { validateProject } from '../models/validation';
import { v4 as uuidv4 } from 'uuid';

export interface ProjectEntity extends Project {
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectData {
  coreIdea: string;
  targetWordCount?: number;
  language?: Language;
}

export interface ProjectWithDetails extends ProjectEntity {
  characters: Character[];
  chapters: Chapter[];
}

export class ProjectRepository extends BaseRepository<ProjectEntity> {
  protected tableName = 'projects';

  protected mapRowToEntity(row: any): ProjectEntity {
    return {
      id: row.id,
      coreIdea: row.core_idea,
      outline: row.outline ? (typeof row.outline === 'string' ? JSON.parse(row.outline) : row.outline) : this.getDefaultOutline(),
      style: row.style ? (typeof row.style === 'string' ? JSON.parse(row.style) : row.style) : this.getDefaultStyle(),
      chapters: [], // 需要单独查询
      currentWordCount: row.current_word_count || 0,
      targetWordCount: row.target_word_count || 1000000,
      language: row.language || Language.CHINESE,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  protected mapEntityToRow(entity: Partial<ProjectEntity>): any {
    const row: any = {};
    
    if (entity.id) row.id = entity.id;
    if (entity.coreIdea) row.core_idea = entity.coreIdea;
    if (entity.outline) row.outline = JSON.stringify(entity.outline);
    if (entity.style) row.style = JSON.stringify(entity.style);
    if (entity.currentWordCount !== undefined) row.current_word_count = entity.currentWordCount;
    if (entity.targetWordCount !== undefined) row.target_word_count = entity.targetWordCount;
    if (entity.language) row.language = entity.language;
    
    return row;
  }

  // 创建新项目
  public async createProject(data: CreateProjectData): Promise<ProjectEntity> {
    // 验证核心思想
    const tempProject: Project = {
      id: uuidv4(),
      coreIdea: data.coreIdea,
      outline: this.getDefaultOutline(),
      style: this.getDefaultStyle(),
      chapters: [],
      currentWordCount: 0,
      targetWordCount: data.targetWordCount || 1000000,
      language: data.language || Language.CHINESE,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validation = validateProject(tempProject);
    if (!validation.isValid) {
      throw new Error(`Project validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    return await this.create({
      id: tempProject.id,
      coreIdea: tempProject.coreIdea,
      outline: tempProject.outline,
      style: tempProject.style,
      chapters: [],
      currentWordCount: 0,
      targetWordCount: tempProject.targetWordCount,
      language: tempProject.language
    });
  }

  // 获取项目详情（包含角色和章节）
  public async findProjectWithDetails(id: string): Promise<ProjectWithDetails | null> {
    const project = await this.findById(id);
    if (!project) {
      return null;
    }

    // 查询关联的角色
    const charactersQuery = `SELECT * FROM characters WHERE project_id = ? ORDER BY created_at`;
    const [characterRows] = await this.executeQuery(charactersQuery, [id]);
    const characters = characterRows.map(row => this.mapCharacterRowToEntity(row));

    // 查询关联的章节
    const chaptersQuery = `SELECT * FROM chapters WHERE project_id = ? ORDER BY chapter_order, created_at`;
    const [chapterRows] = await this.executeQuery(chaptersQuery, [id]);
    const chapters = chapterRows.map(row => this.mapChapterRowToEntity(row));

    return {
      ...project,
      characters,
      chapters
    };
  }

  // 更新项目字数统计
  public async updateWordCount(id: string): Promise<ProjectEntity | null> {
    // 计算所有章节的实际字数总和
    const query = `
      SELECT COALESCE(SUM(actual_word_count), 0) as total_words 
      FROM chapters 
      WHERE project_id = ?
    `;
    const [rows] = await this.executeQuery(query, [id]);
    const totalWords = (rows[0] as any).total_words;

    return await this.update(id, { currentWordCount: totalWords });
  }

  // 获取项目进度统计
  public async getProjectProgress(id: string): Promise<{
    totalChapters: number;
    completedChapters: number;
    currentWords: number;
    targetWords: number;
    progressPercentage: number;
  } | null> {
    const project = await this.findById(id);
    if (!project) {
      return null;
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_chapters,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_chapters,
        COALESCE(SUM(actual_word_count), 0) as current_words
      FROM chapters 
      WHERE project_id = ?
    `;
    const [rows] = await this.executeQuery(statsQuery, [id]);
    const stats = rows[0] as any;

    const progressPercentage = project.targetWordCount > 0 
      ? Math.min((stats.current_words / project.targetWordCount) * 100, 100)
      : 0;

    return {
      totalChapters: Number(stats.total_chapters),
      completedChapters: Number(stats.completed_chapters),
      currentWords: Number(stats.current_words),
      targetWords: project.targetWordCount,
      progressPercentage: Math.round(progressPercentage * 100) / 100
    };
  }

  // 搜索项目
  public async searchProjects(keyword: string): Promise<ProjectEntity[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE core_idea LIKE ? OR JSON_EXTRACT(outline, '$.mainTheme') LIKE ?
      ORDER BY updated_at DESC
    `;
    const searchTerm = `%${keyword}%`;
    const [rows] = await this.executeQuery(query, [searchTerm, searchTerm]);
    
    return rows.map(row => this.mapRowToEntity(row));
  }

  // 获取最近的项目
  public async getRecentProjects(limit: number = 5): Promise<ProjectEntity[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      ORDER BY updated_at DESC 
      LIMIT ?
    `;
    const [rows] = await this.executeQuery(query, [limit]);
    
    return rows.map(row => this.mapRowToEntity(row));
  }

  // 删除项目及其所有关联数据
  public async deleteProjectWithDetails(id: string): Promise<boolean> {
    return await this.executeTransaction(async (connection) => {
      // MySQL 的外键约束会自动删除关联数据，但我们可以显式删除以确保
      const tables = [
        'plot_requirements',
        'image_inputs', 
        'conflicts',
        'plot_structures',
        'world_settings',
        'chapters',
        'characters'
      ];

      for (const table of tables) {
        await connection.execute(`DELETE FROM ${table} WHERE project_id = ?`, [id]);
      }

      const [result] = await connection.execute(`DELETE FROM projects WHERE id = ?`, [id]);
      return (result as any).affectedRows > 0;
    });
  }

  // 辅助方法：获取默认大纲
  private getDefaultOutline(): Outline {
    return {
      mainTheme: '待定主题',
      characters: [],
      worldSetting: {
        timeperiod: '现代',
        location: '待定地点',
        socialContext: '现代社会',
        rules: [],
        atmosphere: '待定氛围'
      },
      plotStructure: {
        exposition: '故事开端',
        risingAction: [],
        climax: '故事高潮',
        fallingAction: [],
        resolution: '故事结局'
      },
      conflicts: []
    };
  }

  // 辅助方法：获取默认写作风格
  private getDefaultStyle(): WritingStyle {
    return {
      id: uuidv4(),
      name: '默认风格',
      description: '标准的小说写作风格',
      characteristics: {
        tone: '中性',
        pacing: '适中',
        vocabulary: '标准',
        sentenceStructure: '平衡',
        narrativeVoice: '第三人称'
      },
      examples: []
    };
  }

  // 辅助方法：映射角色行到实体
  private mapCharacterRowToEntity(row: any): Character {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      personality: row.personality ? JSON.parse(row.personality) : [],
      background: row.background || '',
      relationships: row.relationships ? JSON.parse(row.relationships) : [],
      developmentArc: row.development_arc || ''
    };
  }

  // 辅助方法：映射章节行到实体
  private mapChapterRowToEntity(row: any): Chapter {
    return {
      id: row.id,
      title: row.title,
      summary: row.summary || '',
      keyPlotPoints: row.key_plot_points ? JSON.parse(row.key_plot_points) : [],
      requiredElements: row.required_elements ? JSON.parse(row.required_elements) : [],
      estimatedWordCount: row.estimated_word_count || 0,
      actualWordCount: row.actual_word_count || 0,
      content: row.content || '',
      status: row.status
    };
  }
}