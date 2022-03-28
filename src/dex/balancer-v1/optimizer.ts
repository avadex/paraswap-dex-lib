import { UnoptimizedRate, OptimalSwapExchange } from '../../types';
import { BalancerSwap } from './types';
import { SwapSide } from '../../constants';
import { BalancerV1Config } from './config';
import BigNumber from 'bignumber.js';

const MAX_UINT256 =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';

const BalancerV1 = Object.keys(BalancerV1Config)[0];

export function balancerV1Merge(or: UnoptimizedRate): UnoptimizedRate {
  const fixSwap = (
    rawSwap: OptimalSwapExchange<any>[],
    side: SwapSide,
  ): OptimalSwapExchange<any>[] => {
    let newBalancer: OptimalSwapExchange<any> = {
      exchange: BalancerV1,
      srcAmount: '0',
      destAmount: '0',
      percent: 0,
      poolAddresses: [],
      data: {
        swaps: new Array<BalancerSwap>(),
        gasUSD: '0',
      },
    };
    let optimizedSwap = new Array<OptimalSwapExchange<any>>();
    rawSwap.forEach((s: OptimalSwapExchange<any>) => {
      if (s.exchange.toLowerCase() === BalancerV1.toLowerCase()) {
        newBalancer.srcAmount = new BigNumber(newBalancer.srcAmount)
          .plus(s.srcAmount)
          .toFixed();
        newBalancer.destAmount = new BigNumber(newBalancer.destAmount)
          .plus(s.destAmount)
          .toFixed();
        newBalancer.percent += s.percent;
        newBalancer.data.exchangeProxy = s.data.exchangeProxy;
        newBalancer.data.gasUSD = new BigNumber(newBalancer.data.gasUSD)
          .plus(s.data.gasUSD)
          .toFixed();
        newBalancer.data.swaps.push({
          pool: s.data.pool,
          tokenInParam: s.srcAmount,
          tokenOutParam: side === SwapSide.SELL ? '0' : s.destAmount,
          maxPrice: MAX_UINT256,
        });
        newBalancer.poolAddresses!.push(s.poolAddresses![0]);
      } else {
        optimizedSwap.push(s);
      }
    });
    if (newBalancer.data.swaps.length) optimizedSwap.push(newBalancer);
    return optimizedSwap;
  };

  or.bestRoute = or.bestRoute.map(r => ({
    ...r,
    swaps: r.swaps.map(s => ({
      ...s,
      swapExchanges: fixSwap(s.swapExchanges, or.side),
    })),
  }));
  return or;
}