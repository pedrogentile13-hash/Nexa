-- Tira de escolas com endereço próprio (ex.: Anglo Morumbi) todo ALUNO que não foi
-- criado pelo painel da escola (sem login da escola). Não apaga conta nenhuma.
update public.profiles p
set school_id = null, class_id = null
where p.role = 'student'
  and p.school_login is null
  and p.school_id in (select d.school_id from public.school_domains d);
