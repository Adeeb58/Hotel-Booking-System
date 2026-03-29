package com.bookingservice.bookingservice.config;

import com.bookingservice.bookingservice.entity.Promotion;
import com.bookingservice.bookingservice.repository.PromotionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;

@Configuration
public class SeedDataConfig {

    @Bean
    public CommandLineRunner initPromotions(PromotionRepository promotionRepository) {
        return args -> {
            if (promotionRepository.findByCode("SAVE10").isEmpty()) {
                Promotion p1 = new Promotion();
                p1.setCode("SAVE10");
                p1.setDiscountPercentage(10.0);
                p1.setStartDate(LocalDate.now().minusDays(1));
                p1.setEndDate(LocalDate.now().plusYears(1));
                p1.setActive(true);
                promotionRepository.save(p1);
            }
            if (promotionRepository.findByCode("WELCOME20").isEmpty()) {
                Promotion p2 = new Promotion();
                p2.setCode("WELCOME20");
                p2.setDiscountPercentage(20.0);
                p2.setStartDate(LocalDate.now().minusDays(1));
                p2.setEndDate(LocalDate.now().plusYears(1));
                p2.setActive(true);
                promotionRepository.save(p2);
            }
        };
    }
}
