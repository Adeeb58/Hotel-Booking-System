package com.bookingservice.bookingservice.service;

import com.bookingservice.bookingservice.entity.Promotion;
import com.bookingservice.bookingservice.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private final PromotionRepository promotionRepository;

    public Promotion validateAndGetPromotion(String code) {
        Optional<Promotion> promotionOpt = promotionRepository.findByCode(code);
        if (promotionOpt.isEmpty()) {
            throw new RuntimeException("Invalid promotion code");
        }

        Promotion promotion = promotionOpt.get();
        if (!promotion.isActive()) {
            throw new RuntimeException("Promotion is no longer active");
        }

        LocalDate today = LocalDate.now();
        if (today.isBefore(promotion.getStartDate()) || today.isAfter(promotion.getEndDate())) {
            throw new RuntimeException("Promotion is expired or not yet active");
        }

        return promotion;
    }

    public Promotion createPromotion(Promotion promotion) {
        return promotionRepository.save(promotion);
    }
}
