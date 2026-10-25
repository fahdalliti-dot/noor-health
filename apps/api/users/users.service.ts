import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User } from '@doctors-morocco/db';
import { AuthRepository } from '../db/repository';

@Injectable()
export class UsersService {
  constructor(private authRepository: AuthRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.authRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(clinicId: string): Promise<User[]> {
    return this.authRepository.findAllByClinic(clinicId);
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.authRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Can't update own role or deactivate last admin
    // These checks would be handled in the controller

    const updated = await this.authRepository.update(id, updates);
    return updated;
  }

  async deactivate(id: string, actorId: string): Promise<User> {
    const user = await this.authRepository.findById(id);
    const actor = await this.authRepository.findById(actorId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deactivating the last active admin
    if (user.role === 'admin' && user.is_active) {
      const activeAdmins = await this.authRepository.countActiveAdmins(user.clinic_id);
      if (activeAdmins <= 1) {
        throw new ForbiddenException('Cannot deactivate the last active admin');
      }
    }

    return this.authRepository.update(id, { is_active: false, deactivated_at: new Date() });
  }
}