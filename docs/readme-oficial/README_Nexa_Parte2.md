# README Nexa - Parte 2

## Arquitetura, Banco de Dados e Regras de Negócio

# Arquitetura

Frontend: - Next.js - React - TypeScript - Tailwind CSS - shadcn/ui

Backend: - Supabase - PostgreSQL - Storage - Auth

## Estrutura de Pastas

    app/
    components/
    features/
    hooks/
    lib/
    services/
    types/
    database/

## Modelo de Dados

### users

- id
- name
- email
- avatar
- school_id
- grade
- class_name

### schools

- id
- name
- city
- state

### subjects

- id
- user_id
- name
- color
- icon

### assessment_categories

- id
- subject_id
- name
- percentage

Categorias padrão: - PB (35%) - VA (35%) - Qualitativa (30%)

### assessments

Representa cada atividade.

Campos: - id - category_id - title - grade - weight - date - teacher -
observations

### tasks

- id
- subject_id
- title
- due_date
- completed
- priority

### study_sessions

- id
- subject_id
- duration
- date

## Regras de Negócio

### Cálculo da categoria

Cada categoria possui diversas atividades.

Exemplo:

Lista 1 Nota 8 Peso 2

Lista 2 Nota 10 Peso 1

Prova Nota 6 Peso 7

A média da categoria deve ser calculada automaticamente utilizando média
ponderada.

### Média Final

PB × percentual

VA × percentual

Qualitativa × percentual

Resultado = Média Final.

Os percentuais devem ser configuráveis.

## Fluxo do Usuário

Login

↓

Página Hoje

↓

Executar tarefas

↓

Registrar estudo

↓

Cadastrar notas

↓

Visualizar desempenho

## Permissões

Aluno: - editar apenas seus dados

Administrador (futuro): - gerenciar usuários - gerenciar escolas -
gerenciar configurações

## Escalabilidade

O sistema nunca poderá depender de uma escola específica.

Tudo deverá ser configurável: - disciplinas - categorias - pesos -
calendário - séries

## Gamificação

- XP
- Níveis
- Conquistas
- Sequência de estudos
- Metas semanais

## Regras de UX

- Mobile First
- Máximo de 3 cliques para qualquer função
- Interface limpa
- Feedback visual imediato
- Salvamento automático sempre que possível

## Objetivo Técnico

Toda funcionalidade deve ser reutilizável para permitir que o Nexa
evolua de um projeto pessoal para uma plataforma SaaS com múltiplos
usuários.
