import { getRepository } from 'typeorm';
import Category from '../models/Category';

interface CategoryData {
  title: string;
}

class CreateCategoryService {
  public async execute({ title }: CategoryData): Promise<Category> {
    const categoriesRepository = getRepository(Category);
    const foundCategory = await categoriesRepository.findOne({
      where: { title },
    });
    if (!foundCategory) {
      const category = categoriesRepository.create({ title });
      await categoriesRepository.save(category);
      return category;
    }
    return foundCategory;
  }
}

export default CreateCategoryService;
