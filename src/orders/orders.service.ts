import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      let total = 0;

      // 1. Tính tổng tiền và check tồn kho
      for (const item of createOrderDto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm ${item.productId} không đủ hàng!`,
          );
        }
        total += product.price * item.quantity;

        // 2. Trừ kho
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 3. Tạo đơn hàng
      const order = await tx.order.create({
        data: {
          customerName: createOrderDto.customerName,
          total: total,
          status: 'PENDING',
        },
      });
      this.eventEmitter.emit('order.placed', {
        orderId: order.id,
        customer: order.customerName,
        total: order.total,
      });

      return order;
    });
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: string) {
    return `This action returns a #${id} order`;
  }

  update(id: string, updateOrderDto: UpdateOrderDto) {
    console.log(
      `Updating order #${id} with data:`,
      JSON.stringify(updateOrderDto),
    );
    return `This action updates a #${id} order`;
  }

  remove(id: string) {
    return `This action removes a #${id} order`;
  }
}
