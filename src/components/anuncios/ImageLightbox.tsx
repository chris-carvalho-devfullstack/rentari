// src/components/anuncios/ImageLightbox.tsx
'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { Icon } from '@/components/ui/Icon';
import { faTimes, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface ImageLightboxProps {
    images: string[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (direction: 'prev' | 'next') => void;
}

/**
 * Modal de Lightbox para exibição de imagens em tela cheia com navegação.
 */
export const ImageLightbox: React.FC<ImageLightboxProps> = ({
    images,
    currentIndex,
    isOpen,
    onClose,
    onNavigate,
}) => {
    
    // Referência para o container principal para detectar cliques fora
    const modalRef = useRef<HTMLDivElement>(null);

    // Navegação via teclado (setas) e fechar (ESC)
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowLeft') {
            onNavigate('prev');
        } else if (e.key === 'ArrowRight') {
            onNavigate('next');
        }
    }, [isOpen, onClose, onNavigate]);

    // Hook para adicionar e remover listeners de teclado
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
    
    // Função para fechar ao clicar no fundo (fora da imagem)
    const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Verifica se o clique ocorreu no próprio modalRef (fundo) e não em seus filhos (imagem/navegação)
        if (modalRef.current && e.target === modalRef.current) {
            onClose();
        }
    };


    if (!isOpen) return null;
    
    const currentImage = images[currentIndex];
    const hasMultipleImages = images.length > 1;

    return (
        // Overlay Fundo escuro (fechar ao clicar no fundo)
        <div
            ref={modalRef}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={handleBackgroundClick}
        >
            {/* Botão de Fechar (Canto Superior Direito) */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 text-white bg-black/50 hover:bg-black/70 rounded-full z-50 transition-colors"
                aria-label="Fechar galeria"
            >
                <Icon icon={faTimes} className="w-6 h-6" />
            </button>

            {/* Container Central da Imagem e Navegação */}
            <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
                
                {/* Botão de Navegação: Anterior */}
                {hasMultipleImages && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
                        className="absolute left-4 p-4 text-white bg-black/50 hover:bg-black/80 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed z-40"
                        aria-label="Imagem anterior"
                        disabled={currentIndex === 0}
                    >
                        <Icon icon={faChevronLeft} className="w-6 h-6" />
                    </button>
                )}

                {/* Imagem em Destaque */}
                <img
                    src={currentImage}
                    alt={`Imagem ${currentIndex + 1} de ${images.length}`}
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()} // Impede que o clique na imagem feche o modal
                />

                {/* Botão de Navegação: Próxima */}
                {hasMultipleImages && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
                        className="absolute right-4 p-4 text-white bg-black/50 hover:bg-black/80 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed z-40"
                        aria-label="Próxima imagem"
                        disabled={currentIndex === images.length - 1}
                    >
                        <Icon icon={faChevronRight} className="w-6 h-6" />
                    </button>
                )}
            </div>
            
            {/* Indicador de Imagem (Rodapé) */}
            {hasMultipleImages && (
                 <div className="absolute bottom-6 p-2 bg-black/50 text-white rounded-md text-sm font-medium z-50">
                    {currentIndex + 1} de {images.length}
                </div>
            )}
        </div>
    );
};