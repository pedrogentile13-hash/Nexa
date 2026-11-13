-- Correção de conteúdo (Grande criação 2), 12/11/2026. Seguro rodar mais de uma vez.
-- 1) BRICS: "originalmente" estava impreciso (a África do Sul entrou em 2011).
-- 2) Amazônia Legal: o Mato Grosso entra inteiro (não só "parte").
update public.questions set statement = 'Antes da ampliação de 2024, o BRICS era formado por:', explanation = 'O grupo começou como BRIC (2009); a África do Sul entrou em 2011 e novos membros chegaram a partir de 2024.' where id = 'dafffdd8-be46-52fc-99fb-bc06f80bc2db';
update public.question_options set body = 'Brasil, Rússia, Índia, China e África do Sul' where id = 'e1f97d1d-3b65-531c-80b0-2b722d95bc52';
update public.questions set statement = 'A Amazônia Legal abrange', explanation = 'Região definida por lei para planejamento: os 7 estados do Norte, o Mato Grosso inteiro e o oeste do Maranhão.' where id = '50d98c58-5e60-50c2-987d-44a00b1c673e';
update public.question_options set body = 'todos os estados da Região Norte, todo o Mato Grosso e parte do Maranhão.' where id = '0c289c5a-247e-531f-93fb-64479b96e801';
