import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionType from '../models/enums/TransactionTypeEnum';
import CreateCategoryService from './CreateCategoryService';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: TransactionType;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (!Object.values(TransactionType).includes(type)) {
      throw new AppError("Invalid 'type' for request.", 400);
    }
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const { total } = await transactionsRepository.getBalance();

    if (type === TransactionType.OUTCOME && total < value) {
      throw new AppError('Insufficient funds.');
    }

    const createCategory = new CreateCategoryService();
    const newCategory = await createCategory.execute({
      title: category,
    });

    const transaction = transactionsRepository.create({
      title,
      value: Math.abs(Number(value)),
      type,
      category: newCategory,
    });
    await transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
