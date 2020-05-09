import csvParse from 'csv-parse';
import fs from 'fs';
import { getRepository, In, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionType from '../models/enums/TransactionTypeEnum';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface CSVTransaction {
  title: string;
  type: TransactionType;
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((item: string) =>
        item.trim(),
      );
      if (!title || !type || !value) return;
      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const categoriesRepository = getRepository(Category);

    // Getting existent categories in database that match those within the CVS file
    const existentCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const existentCategoriesTitles = existentCategories.map(
      category => category.title,
    );

    // Keeping only unexistent categories in database and removing duplicates from array
    const addCategories = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, array) => array.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategories.map(category => ({ title: category })),
    );

    // Bulk insertion
    await categoriesRepository.save(newCategories);

    const allCategories = [...existentCategories, ...newCategories];

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const addedTransactions = transactions.map(transaction => {
      if (!Object.values(TransactionType).includes(transaction.type)) {
        throw new AppError("Invalid 'type' for request.", 400);
      }
      return transactionsRepository.create({
        title: transaction.title,
        value: Math.abs(transaction.value),
        type: transaction.type,
        category: allCategories.find(
          category => transaction.category === category.title,
        ),
      });
    });
    await transactionsRepository.save(addedTransactions);
    await fs.promises.unlink(filePath);
    return addedTransactions;
  }
}

export default ImportTransactionsService;
